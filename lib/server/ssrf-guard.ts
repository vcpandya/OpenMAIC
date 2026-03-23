/**
 * SSRF (Server-Side Request Forgery) protection utilities.
 *
 * Validates URLs to prevent requests to internal/private network addresses.
 * Used by any API route that fetches a user-supplied URL server-side.
 */

/** Check if hostname is in the 172.16.0.0 - 172.31.255.255 private range */
function isPrivate172(hostname: string): boolean {
  if (!hostname.startsWith('172.')) return false;
  const second = parseInt(hostname.split('.')[1], 10);
  return second >= 16 && second <= 31;
}

/** Check if an IPv4 address string is private/loopback */
function isPrivateIPv4(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('169.254.') ||
    isPrivate172(ip)
  );
}

/**
 * Validate a URL against SSRF attacks.
 * Returns null if the URL is safe, or an error message string if blocked.
 */
export function validateUrlForSSRF(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL';
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return 'Only HTTP(S) URLs are allowed';
  }

  const hostname = parsed.hostname.toLowerCase();

  // IPv4 and domain checks
  if (
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('169.254.') ||
    isPrivate172(hostname) ||
    hostname.endsWith('.local')
  ) {
    return 'Local/private network URLs are not allowed';
  }

  // IPv6 checks — only apply prefix-based rules to actual IPv6 addresses (contain ':')
  if (hostname.includes(':')) {
    const bare = hostname.replace(/^\[|\]$/g, '');
    if (
      bare === '::1' ||
      bare === '::' ||
      bare.startsWith('fd') || // ULA fd00::/8
      bare.startsWith('fe80') // Link-local fe80::/10
    ) {
      return 'Local/private network URLs are not allowed';
    }
    // IPv4-mapped IPv6 (e.g., ::ffff:127.0.0.1)
    if (bare.startsWith('::ffff:')) {
      const ipv4Part = bare.slice(7);
      if (isPrivateIPv4(ipv4Part)) {
        return 'Local/private network URLs are not allowed';
      }
    }
  } else if (hostname === '127.0.0.1') {
    return 'Local/private network URLs are not allowed';
  }

  return null;
}

/**
 * White-label branding configuration.
 * Reads from environment variables, falls back to OpenMAIC defaults.
 */

export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'OpenMAIC',
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '/logo-horizontal.png',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#722ed1',
} as const;

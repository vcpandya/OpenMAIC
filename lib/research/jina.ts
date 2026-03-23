/**
 * Jina AI integration for daily auto-learning research.
 * Uses Jina Search (s.jina.ai) for finding content and Jina Reader (r.jina.ai) for extraction.
 */

import { createLogger } from '@/lib/logger';

const log = createLogger('Jina');

export interface JinaSearchResult {
  title: string;
  url: string;
  description: string;
  content?: string;
}

/** Search for content using Jina Search API */
export async function searchJina(query: string, maxResults = 5): Promise<JinaSearchResult[]> {
  const apiKey = process.env.JINA_API_KEY;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, { headers });
    if (!res.ok) {
      log.warn(`Jina search failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.data || []).slice(0, maxResults).map((r: Record<string, string>) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
      content: r.content || '',
    }));
  } catch (err) {
    log.error('Jina search error:', err);
    return [];
  }
}

/** Read full article content using Jina Reader API */
export async function readJina(url: string): Promise<string | null> {
  const apiKey = process.env.JINA_API_KEY;
  const headers: Record<string, string> = {
    Accept: 'text/plain',
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`https://r.jina.ai/${url}`, { headers });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 10000); // Limit to 10K chars
  } catch {
    return null;
  }
}

/** Research a topic and return summarized findings */
export async function researchTopic(topic: string, keywords: string[]): Promise<{
  sources: JinaSearchResult[];
  summary: string;
}> {
  const query = `${topic} ${keywords.join(' ')} latest trends 2024 2025`;
  const results = await searchJina(query, 5);

  // Build summary from descriptions
  const summary = results
    .map((r, i) => `${i + 1}. **${r.title}**: ${r.description}`)
    .join('\n');

  return { sources: results, summary };
}

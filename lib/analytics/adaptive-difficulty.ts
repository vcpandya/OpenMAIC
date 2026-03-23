/**
 * Adaptive difficulty engine.
 * Checks rolling quiz scores and suggests depth changes.
 */

export type DifficultyRecommendation = {
  shouldChange: boolean;
  currentDepth: string;
  suggestedDepth: string;
  avgScore: number;
  reason: string;
} | null;

export function checkAdaptiveDifficulty(
  scores: number[], // Array of recent score percentages (0-100)
  currentDepth: string,
): DifficultyRecommendation {
  if (scores.length < 3) return null; // Need at least 3 data points

  const recent = scores.slice(-5); // Last 5 scores
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

  const depthOrder = ['eli5', 'standard', 'pro'];
  const currentIdx = depthOrder.indexOf(currentDepth);

  if (avg > 85 && currentIdx < depthOrder.length - 1) {
    return {
      shouldChange: true,
      currentDepth,
      suggestedDepth: depthOrder[currentIdx + 1],
      avgScore: Math.round(avg),
      reason: `You're scoring ${Math.round(avg)}% — ready for more advanced content!`,
    };
  }

  if (avg < 50 && currentIdx > 0) {
    return {
      shouldChange: true,
      currentDepth,
      suggestedDepth: depthOrder[currentIdx - 1],
      avgScore: Math.round(avg),
      reason: `Scoring ${Math.round(avg)}% — let's reinforce the fundamentals first.`,
    };
  }

  return null;
}

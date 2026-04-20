export function mergeById<T extends { id: string }>(preferred: T[], fallback: T[]): T[] {
  if (preferred.length === 0) return fallback;
  if (fallback.length === 0) return preferred;

  const seen = new Set(preferred.map((item) => item.id));
  return [...preferred, ...fallback.filter((item) => !seen.has(item.id))];
}
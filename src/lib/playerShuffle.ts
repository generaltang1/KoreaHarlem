/** Fisher–Yates shuffle (in place) */
export function shuffleArray<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** 시작 곡을 맨 앞에 두고 나머지만 셔플 */
export function shuffleQueueFromIndex<T>(tracks: T[], startIndex: number): T[] {
  if (tracks.length <= 1) return [...tracks];
  const safeIndex = Math.min(Math.max(startIndex, 0), tracks.length - 1);
  const start = tracks[safeIndex];
  const rest = tracks.filter((_, i) => i !== safeIndex);
  shuffleArray(rest);
  return [start, ...rest];
}

/** 현재 곡 유지, 이후 대기열만 셔플 */
export function shuffleRemainingQueue<T>(tracks: T[], currentIndex: number): T[] {
  if (tracks.length <= 1 || currentIndex >= tracks.length - 1) return [...tracks];
  const before = tracks.slice(0, currentIndex + 1);
  const after = tracks.slice(currentIndex + 1);
  shuffleArray(after);
  return [...before, ...after];
}

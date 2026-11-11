/** 대표 장르 SELECT 기본 목록 (추후 리스트 교체 가능). 맨 끝은 항상 기타. */
export const ARTIST_GENRES_BASE = [
  "HIP-HOP",
  "R&B",
  "ELECTRONIC",
  "HOUSE",
  "TECHNO",
  "DRUM & BASS",
  "JAZZ",
  "SOUL",
  "ROCK",
  "POP",
  "EXPERIMENTAL",
  "AMBIENT",
  "REGGAE",
  "AFROBEAT",
  "LATIN",
  "K-HIPHOP",
  "UKG",
  "BREAKBEAT",
  "TRAP",
  "OTHER",
] as const;

export const ARTIST_GENRE_OTHER = "기타";

export function listArtistGenres(query = ""): string[] {
  const q = query.trim().toLowerCase();
  const base = ARTIST_GENRES_BASE.filter((g) => g !== "OTHER").map((g) => g);
  const withOther = [...base, ARTIST_GENRE_OTHER];
  if (!q) return withOther;
  return withOther.filter((g) => g.toLowerCase().includes(q));
}

/** SELECT 박스: 검색 없을 때 기본 10개 + 스크롤로 나머지, 마지막 기타 유지 */
export function genresForSelectBox(query = "", visibleDefault = 10): string[] {
  const all = listArtistGenres(query);
  if (query.trim()) return all;
  const withoutOther = all.filter((g) => g !== ARTIST_GENRE_OTHER);
  const head = withoutOther.slice(0, visibleDefault);
  const rest = withoutOther.slice(visibleDefault);
  return [...head, ...rest, ARTIST_GENRE_OTHER];
}

export function sanitizeSearchTerm(value?: string | null): string {
  return (value ?? "").trim().slice(0, 100);
}

/** Escape LIKE wildcards and PostgREST filter separators. */
export function toIlikePattern(term: string): string {
  return `%${term.replace(/[%_,.()]/g, "")}%`;
}

export function parseSearchQuery(value?: string): string {
  return sanitizeSearchTerm(value);
}

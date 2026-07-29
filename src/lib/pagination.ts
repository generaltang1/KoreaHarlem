export const PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 10;

export function parsePage(value?: string): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function getRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

export function getTotalPages(totalCount: number, pageSize: number): number {
  if (totalCount <= 0) return 1;
  return Math.ceil(totalCount / pageSize);
}

export function buildPageUrl(
  basePath: string,
  page: number,
  params?: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) searchParams.set(key, value);
    }
  }

  if (page > 1) searchParams.set("page", String(page));

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

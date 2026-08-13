export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/** @deprecated Use DEFAULT_PAGE_SIZE / parsePageSize */
export const PAGE_SIZE = DEFAULT_PAGE_SIZE;
/** @deprecated Use DEFAULT_PAGE_SIZE / parsePageSize */
export const ADMIN_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export function parsePage(value?: string): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function parsePageSize(value?: string): number {
  const size = Number.parseInt(value ?? String(DEFAULT_PAGE_SIZE), 10);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size)
    ? size
    : DEFAULT_PAGE_SIZE;
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

export function pageSizeParams(
  pageSize: number,
  extra?: Record<string, string | undefined>,
): Record<string, string | undefined> {
  return {
    ...extra,
    size: pageSize === DEFAULT_PAGE_SIZE ? undefined : String(pageSize),
  };
}

export function listParams(options: {
  pageSize: number;
  q?: string;
  category?: string;
  sub?: string;
  status?: string;
}): Record<string, string | undefined> {
  const q = options.q?.trim();
  return pageSizeParams(options.pageSize, {
    q: q || undefined,
    category: options.category,
    sub: options.sub,
    status: options.status,
  });
}

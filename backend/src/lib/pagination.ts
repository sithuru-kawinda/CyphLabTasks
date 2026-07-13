export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export function parsePagination(query: PaginationQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildMeta(page: number, pageSize: number, total: number) {
  return { page, pageSize, total };
}

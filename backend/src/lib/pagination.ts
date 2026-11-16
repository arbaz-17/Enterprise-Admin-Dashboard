
interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
}

export function createPagination({
  page,
  pageSize,
  total,
}: PaginationParams) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

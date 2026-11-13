import type { Table as TanStackTable } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  total: number;
  label: string;
  isFetching?: boolean;
}

export function DataTablePagination<TData>({
  table,
  total,
  label,
  isFetching = false,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;

  const count = table.getRowModel().rows.length;

  const start = count > 0 ? pageIndex * pageSize + 1 : 0;

  const end = count > 0 ? start + count - 1 : 0;

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {count > 0 ? `${start}–${end}` : "0"} of {total}
      </p>

      <nav aria-label={`${label} pages`} className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!table.getCanPreviousPage() || isFetching}
          onClick={() => table.previousPage()}
        >
          Previous
        </Button>

        <span className="text-xs text-muted-foreground">
          Page {pageIndex + 1} of {table.getPageCount()}
        </span>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!table.getCanNextPage() || isFetching}
          onClick={() => table.nextPage()}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}

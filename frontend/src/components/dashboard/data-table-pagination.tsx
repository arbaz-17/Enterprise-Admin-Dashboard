import { useId } from "react";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { PAGE_SIZES } from "./table-url-state";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  total: number;
  label: string;
  isFetching?: boolean;
  onPageSizeChange: (size: number) => void;
}

export function DataTablePagination<TData>({
  table,
  total,
  label,
  isFetching = false,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const selectId = useId();

  const { pageIndex, pageSize } = table.getState().pagination;

  const count = table.getRowModel().rows.length;

  const start = count > 0 ? pageIndex * pageSize + 1 : 0;

  const end = count > 0 ? start + count - 1 : 0;

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total} records
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={selectId} className="text-xs text-muted-foreground">
          Rows per page
        </label>

        <select
          id={selectId}
          value={pageSize}
          disabled={isFetching}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <nav aria-label={`${label} pages`} className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!table.getCanPreviousPage() || isFetching}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>

          <span className="min-w-16 text-center text-xs tabular-nums text-muted-foreground">
            {pageIndex + 1} / {table.getPageCount()}
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
    </div>
  );
}

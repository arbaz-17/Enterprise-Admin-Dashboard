import { useState } from "react";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { ArrowDown, ArrowUp, ArrowUpDown, Columns3 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";

interface BaseProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  tableLabel: string;
  getRowId?: (row: TData) => string;
  emptyMessage?: string;
  isFetching?: boolean;
  isLoading?: boolean;
}

interface ServerPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

interface ClientTableProps {
  page?: never;
  pageSize?: never;
  total?: never;
  onPageChange?: never;
  onPageSizeChange?: never;
  sorting?: never;
  onSortingChange?: never;
}

type DataTableProps<TData> = BaseProps<TData> &
  (ServerPaginationProps | ClientTableProps);

export function DataTable<TData>(props: DataTableProps<TData>) {
  const {
    columns,
    data,
    tableLabel,
    getRowId,
    emptyMessage = "No records found.",
    isFetching = false,
    isLoading = false,
  } = props;

  const isServerTable = props.page !== undefined;

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [localSorting, setLocalSorting] = useState<SortingState>([]);

  const pagination = {
    pageIndex: isServerTable ? props.page - 1 : 0,
    pageSize: isServerTable ? props.pageSize : Math.max(data.length, 1),
  };

  const sorting = isServerTable ? props.sorting : localSorting;

  const table = useReactTable({
    data,
    columns,
    getRowId,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),

    // Server tables receive already-sorted and
    // already-paginated data.
    manualSorting: isServerTable,
    manualPagination: isServerTable,

    rowCount: isServerTable ? props.total : undefined,

    enableMultiSort: false,
    enableSortingRemoval: false,
    sortDescFirst: false,

    state: {
      pagination,
      sorting,
      columnVisibility,
    },

    onColumnVisibilityChange: setColumnVisibility,

    onSortingChange: (updater) => {
      if (props.page !== undefined) {
        props.onSortingChange(updater);
      } else {
        setLocalSorting(updater);
      }
    },

    onPaginationChange: (updater) => {
      if (props.page === undefined) return;

      const next =
        typeof updater === "function" ? updater(pagination) : updater;

      if (next.pageIndex !== pagination.pageIndex) {
        props.onPageChange(next.pageIndex + 1);
      }
    },
  });

  const rows = table.getRowModel().rows;

  const visibleColumns = table.getVisibleLeafColumns();

  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  return (
    <div className="space-y-4" aria-busy={isFetching || isLoading}>
      {/* Table controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-xs text-muted-foreground"
          role={isFetching ? "status" : undefined}
        >
          {isLoading
            ? "Loading records..."
            : isFetching
              ? "Updating records..."
              : `${rows.length} records displayed`}
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <Columns3 className="size-4" aria-hidden="true" />
              Columns
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>

            <DropdownMenuSeparator />

            {hideableColumns.map((column) => {
              const header = column.columnDef.header;

              const label =
                typeof header === "string"
                  ? header
                  : column.id.replace(/([a-z])([A-Z])/g, "$1 $2");

              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  disabled={column.getIsVisible() && visibleColumns.length <= 1}
                  onCheckedChange={(checked) =>
                    column.toggleVisibility(Boolean(checked))
                  }
                >
                  {label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table content */}
      <div className="relative overflow-hidden rounded-md border">
        {isFetching && (
          <div
            className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/15"
            aria-hidden="true"
          >
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
        )}

        <div
          className={
            isFetching ? "opacity-70 transition-opacity" : "transition-opacity"
          }
        >
          <Table aria-label={tableLabel}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const column = header.column;

                    const isSorted = column.getIsSorted();

                    return (
                      <TableHead
                        key={header.id}
                        scope="col"
                        aria-sort={
                          isSorted === "asc"
                            ? "ascending"
                            : isSorted === "desc"
                              ? "descending"
                              : "none"
                        }
                      >
                        {header.isPlaceholder ? null : column.getCanSort() ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-sm text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                            onClick={() =>
                              column.toggleSorting(isSorted === "asc")
                            }
                          >
                            {flexRender(
                              column.columnDef.header,
                              header.getContext(),
                            )}

                            {isSorted === "asc" ? (
                              <ArrowUp
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            ) : isSorted === "desc" ? (
                              <ArrowDown
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <ArrowUpDown
                                className="size-3.5 opacity-40"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        ) : (
                          flexRender(
                            column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id}>
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(visibleColumns.length, 1)}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Server-side pagination */}
      {props.page !== undefined && !isLoading && props.total > 0 && (
        <DataTablePagination
          table={table}
          total={props.total}
          label={tableLabel}
          isFetching={isFetching}
          onPageSizeChange={props.onPageSizeChange}
        />
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { TableBody, TableCell, TableRow } from "@/components/ui/table";

import { DataTableColumnVisibility } from "./data-table-column-visbility";
import { DataTableHeader } from "./data-table-header";
import { DataTablePagination } from "./data-table-pagination";

// -------------------------------------------------------
// Types
// -------------------------------------------------------

interface BaseProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  tableLabel: string;
  getRowId?: (row: TData) => string;
  emptyMessage?: string;
  isFetching?: boolean;
  isLoading?: boolean;
  virtualize?: boolean;
  constrainHeight?: boolean;
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

// -------------------------------------------------------
// Virtualization configuration
// -------------------------------------------------------

// Small tables continue using normal rendering.
const VIRTUALIZATION_THRESHOLD = 50;

// Estimated row height in pixels.
// Actual row heights are measured after rendering.
const ESTIMATED_ROW_HEIGHT = 72;

// Additional rows rendered outside the visible viewport.
const VIRTUAL_OVERSCAN = 5;

// Matches the `max-h-[32rem]` scroll container (32rem = 512px).
// Used so the very first render already has a viewport size and
// produces visible rows, before the real size is measured.
const INITIAL_VIEWPORT_HEIGHT = 512;

// -------------------------------------------------------
// Virtual row renderer
// -------------------------------------------------------

interface VirtualRowsProps<TData> {
  rows: Row<TData>[];
  columnCount: number;
  // The scroll container element, or null until it has mounted.
  scrollElement: HTMLDivElement | null;
}

function VirtualRows<TData>({
  rows,
  columnCount,
  scrollElement,
}: VirtualRowsProps<TData>) {
  // Stable keys help preserve row identity.
  const getItemKey = useCallback(
    (index: number) => rows[index]?.id ?? index,
    [rows],
  );

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,

    // This is the element that owns the scrollbar.
    // It comes from state, so when the element mounts the parent
    // re-renders and the virtualizer re-attaches to it.
    getScrollElement: () => scrollElement,

    // Initial size until actual row height is measured.
    estimateSize: () => ESTIMATED_ROW_HEIGHT,

    // Render extra rows to avoid blank areas during scrolling.
    overscan: VIRTUAL_OVERSCAN,

    // Viewport size used before the scroll element is measured.
    initialRect: { width: 0, height: INITIAL_VIEWPORT_HEIGHT },

    getItemKey,
  });

  // Only the rows currently needed for rendering.
  const virtualRows = rowVirtualizer.getVirtualItems();

  const firstVirtualRow = virtualRows[0];

  const lastVirtualRow = virtualRows[virtualRows.length - 1];

  // Empty space representing rows above the rendered range.
  const paddingTop = firstVirtualRow?.start ?? 0;

  // Empty space representing rows below the rendered range.
  const paddingBottom = lastVirtualRow
    ? Math.max(0, rowVirtualizer.getTotalSize() - lastVirtualRow.end)
    : 0;

  return (
    <>
      {/* Spacer representing rows above the viewport */}
      {paddingTop > 0 && (
        <TableRow aria-hidden="true" className="border-0 hover:bg-transparent">
          <TableCell
            colSpan={columnCount}
            className="border-0 p-0"
            style={{ height: paddingTop }}
          />
        </TableRow>
      )}

      {/* Only render rows in the virtual range */}
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];

        return (
          <TableRow
            key={row.id}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        );
      })}

      {/* Spacer representing rows below the viewport */}
      {paddingBottom > 0 && (
        <TableRow aria-hidden="true" className="border-0 hover:bg-transparent">
          <TableCell
            colSpan={columnCount}
            className="border-0 p-0"
            style={{ height: paddingBottom }}
          />
        </TableRow>
      )}
    </>
  );
}

// -------------------------------------------------------
// Main reusable DataTable
// -------------------------------------------------------

export function DataTable<TData>(props: DataTableProps<TData>) {
  const {
    columns,
    data,
    tableLabel,
    getRowId,
    emptyMessage = "No records found.",
    isFetching = false,
    isLoading = false,
    virtualize = false,
    constrainHeight = false,
  } = props;

  const isServerTable = props.page !== undefined;

  // The DOM element TanStack Virtual observes for scrolling.
  //
  // This is deliberately state (via a callback ref) rather than useRef.
  // With a plain ref, the child virtualizer's layout effect runs BEFORE
  // the parent's ref is attached, so getScrollElement() returns null on
  // first mount and nothing triggers a re-render afterwards. Using state
  // causes a re-render once the element exists.
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [localSorting, setLocalSorting] = useState<SortingState>([]);

  // -----------------------------------------------------
  // Pagination and sorting
  // -----------------------------------------------------

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

  // The current rows from TanStack Table.
  // These are already sorted where applicable.
  const rows = table.getRowModel().rows;

  const visibleColumns = table.getVisibleLeafColumns();

  // -----------------------------------------------------
  // Enable virtualization only when useful
  // -----------------------------------------------------

  const enableVirtualRows =
    virtualize && !isLoading && rows.length >= VIRTUALIZATION_THRESHOLD;

  const useConstrainedViewport = constrainHeight || enableVirtualRows;

  const sortId = sorting[0]?.id ?? "";
  const sortDesc = sorting[0]?.desc ?? false;

  // Reset scroll when page, page size, sorting,
  // or the fetched dataset changes.
  useEffect(() => {
    if (enableVirtualRows && scrollElement) {
      scrollElement.scrollTop = 0;
    }
  }, [
    enableVirtualRows,
    scrollElement,
    data,
    props.page,
    props.pageSize,
    sortId,
    sortDesc,
  ]);

  // -----------------------------------------------------
  // Render
  // -----------------------------------------------------

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

        <DataTableColumnVisibility table={table} disabled={isLoading} />
      </div>

      {/* Table content */}
      <div className="relative overflow-hidden rounded-md border">
        {/* Fetching indicator */}
        {isFetching && (
          <div
            className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-primary/15"
            aria-hidden="true"
          >
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
        )}

        {/* Single scroll container */}
        <div
          ref={setScrollElement}
          className={`${
            isFetching ? "opacity-70 transition-opacity" : "transition-opacity"
          } ${
            useConstrainedViewport
              ? "max-h-[32rem] overflow-auto"
              : "overflow-x-auto"
          }`}
        >
          {/*
            Native table is intentional.

            The shadcn Table component creates another
            overflow wrapper, which would conflict
            with our virtualizer scroll container.
          */}
          <table
            data-slot="table"
            aria-label={tableLabel}
            className="w-full caption-bottom text-sm"
          >
            {/* Sorting and sticky header UI */}
            <DataTableHeader table={table} sticky={useConstrainedViewport} />

            {/* Table body */}
            <TableBody>
              {isLoading ? (
                // Loading skeletons remain unchanged.
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
                enableVirtualRows ? (
                  // Virtualized rendering for large pages.
                  <VirtualRows
                    rows={rows}
                    columnCount={visibleColumns.length}
                    scrollElement={scrollElement}
                  />
                ) : (
                  // Standard rendering for small pages.
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
                )
              ) : (
                // Empty state.
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
          </table>
        </div>
      </div>

      {/* Existing server-side pagination */}
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

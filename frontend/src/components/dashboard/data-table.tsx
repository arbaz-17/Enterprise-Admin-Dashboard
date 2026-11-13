import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";

interface BaseDataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  tableLabel: string;
  isFetching?: boolean;
  getRowId?: (row: TData) => string;
  emptyMessage?: string;
}

interface PaginatedProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface UnpaginatedProps {
  page?: never;
  pageSize?: never;
  total?: never;
  onPageChange?: never;
}

type DataTableProps<TData> = BaseDataTableProps<TData> &
  (PaginatedProps | UnpaginatedProps);

export function DataTable<TData>(props: DataTableProps<TData>) {
  const {
    columns,
    data,
    tableLabel,
    isFetching = false,
    getRowId,
    emptyMessage = "No records found.",
  } = props;

  // Pagination is enabled only when the parent provides
  // the server-side pagination configuration.
  const isPaginated = props.page !== undefined;

  const pagination = {
    pageIndex: isPaginated ? props.page - 1 : 0,
    pageSize: isPaginated ? props.pageSize : Math.max(data.length, 1),
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,

    // For paginated modules, the API handles pagination.
    // For Project Teams, all returned rows are displayed.
    manualPagination: isPaginated,

    rowCount: isPaginated ? props.total : undefined,

    state: {
      pagination,
    },

    onPaginationChange: (updater) => {
      if (!isPaginated) return;

      const next =
        typeof updater === "function" ? updater(pagination) : updater;

      if (next.pageIndex !== pagination.pageIndex) {
        props.onPageChange(next.pageIndex + 1);
      }
    },
  });

  return (
    <div className="space-y-4" aria-busy={isFetching}>
      <Table aria-label={tableLabel}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} scope="col">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className="py-10 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {isFetching && (
        <p role="status" className="text-xs text-muted-foreground">
          Refreshing {tableLabel.toLowerCase()}...
        </p>
      )}

      {isPaginated && props.total > 0 && (
        <DataTablePagination
          table={table}
          total={props.total}
          label={tableLabel}
          isFetching={isFetching}
        />
      )}
    </div>
  );
}

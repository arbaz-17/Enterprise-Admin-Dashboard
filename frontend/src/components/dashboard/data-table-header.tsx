import { flexRender, type Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataTableHeaderProps<TData> {
  table: Table<TData>;
  sticky: boolean;
}

/** Table header and sorting controls; independent of row virtualization. */
export function DataTableHeader<TData>({
  table,
  sticky,
}: DataTableHeaderProps<TData>) {
  return (
    <TableHeader
      className={sticky ? "sticky top-0 z-10 bg-background" : undefined}
    >
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
                    onClick={() => column.toggleSorting(isSorted === "asc")}
                  >
                    {flexRender(column.columnDef.header, header.getContext())}

                    {isSorted === "asc" ? (
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    ) : isSorted === "desc" ? (
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    ) : (
                      <ArrowUpDown
                        className="size-3.5 opacity-40"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ) : (
                  flexRender(column.columnDef.header, header.getContext())
                )}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}

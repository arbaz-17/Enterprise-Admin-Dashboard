import type { Table } from "@tanstack/react-table";
import { Columns3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableColumnVisibilityProps<TData> {
  table: Table<TData>;
  disabled?: boolean;
}

/** The column-visibility menu, shared by every DataTable instance. */
export function DataTableColumnVisibility<TData>({
  table,
  disabled = false,
}: DataTableColumnVisibilityProps<TData>) {
  const visibleColumns = table.getVisibleLeafColumns();
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
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
  );
}

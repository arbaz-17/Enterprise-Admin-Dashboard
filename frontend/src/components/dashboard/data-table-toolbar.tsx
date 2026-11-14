import type { FormEvent, ReactNode } from "react";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps {
  searchValue: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  searchLabel?: string;
  hasActiveFilters?: boolean;
  onClear?: () => void;
  children?: ReactNode;
}

export function DataTableToolbar({
  searchValue,
  onSearch,
  placeholder = "Search records...",
  searchLabel = "Search records",
  hasActiveFilters = false,
  onClear,
  children,
}: DataTableToolbarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const value = String(formData.get("q") ?? "")
      .trim()
      .slice(0, 100);

    onSearch(value);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-1 items-end gap-2"
      >
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor="data-table-search" className="sr-only">
            {searchLabel}
          </label>

          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <Input
            key={searchValue}
            id="data-table-search"
            name="q"
            type="search"
            defaultValue={searchValue}
            maxLength={100}
            placeholder={placeholder}
            className="h-10 pl-9"
          />
        </div>

        <Button type="submit">Search</Button>
      </form>

      {children && (
        <div className="flex flex-wrap items-end gap-2">{children}</div>
      )}

      {hasActiveFilters && onClear && (
        <Button type="button" variant="outline" onClick={onClear}>
          <X className="size-4" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  );
}

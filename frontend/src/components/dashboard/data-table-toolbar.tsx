import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 350;

interface DataTableToolbarProps {
  searchValue: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  searchLabel?: string;
  hasActiveFilters?: boolean;
  onClear?: () => void;
  children?: ReactNode;
}

interface SearchDraft {
  // Tracks the committed search that this draft was based on.
  source: string;
  value: string;
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
  const searchId = useId();
  const [draft, setDraft] = useState<SearchDraft>({
    source: searchValue,
    value: searchValue,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchRef = useRef(onSearch);

  // Page callbacks close over URL parameters or filters, which may change
  // while a debounce timer is pending. Always invoke the newest callback.
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const cancelPendingSearch = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // External changes (e.g. browser Back/Forward) supersede a pending draft.
  useEffect(() => {
    cancelPendingSearch();
  }, [searchValue, cancelPendingSearch]);

  // Never apply a delayed search after this toolbar has unmounted.
  useEffect(() => cancelPendingSearch, [cancelPendingSearch]);

  // Keep the draft in sync when URL navigation changes the committed value.
  // The guarded render-time adjustment also handles Back/Forward cycles
  // (e.g. "alpha" -> "beta" -> "alpha") without remounting the input.
  if (draft.source !== searchValue) {
    setDraft({ source: searchValue, value: searchValue });
  }

  const inputValue = draft.source === searchValue ? draft.value : searchValue;

  function commitSearch(value: string) {
    cancelPendingSearch();

    const nextSearch = value.trim().slice(0, 100);
    if (nextSearch !== searchValue) {
      onSearchRef.current(nextSearch);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value.slice(0, 100);
    setDraft({ source: searchValue, value: nextValue });
    cancelPendingSearch();

    const normalized = nextValue.trim();

    if (normalized === searchValue) return;

    // Clearing the field (including its native X button) is immediate.
    if (normalized === "") {
      onSearchRef.current("");
      return;
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      onSearchRef.current(normalized);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commitSearch(inputValue);
  }

  function handleClear() {
    cancelPendingSearch();
    setDraft({ source: searchValue, value: "" });
    onClear?.();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-1 items-end gap-2"
      >
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor={searchId} className="sr-only">
            {searchLabel}
          </label>

          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <Input
            id={searchId}
            name="q"
            type="search"
            value={inputValue}
            onChange={handleInputChange}
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
        <Button type="button" variant="outline" onClick={handleClear}>
          <X className="size-4" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  );
}

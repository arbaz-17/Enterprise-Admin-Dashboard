import type { OnChangeFn, SortingState } from "@tanstack/react-table";

export const PAGE_SIZES = [10, 20, 50, 100] as const;

type SortDirection = "asc" | "desc";

interface TableUrlOptions<TSort extends string, TFilter extends string> {
  params: URLSearchParams;
  setParams: (params: URLSearchParams) => void;
  sortKeys: readonly TSort[];
  defaultSortBy: TSort;
  filterKeys?: readonly TFilter[];
}

export function getTableUrlState<TSort extends string, TFilter extends string = never>({
  params,
  setParams,
  sortKeys,
  defaultSortBy,
  filterKeys = [],
}: TableUrlOptions<TSort, TFilter>) {
  const rawPage = Number(params.get("page") ?? 1);
  const rawSize = Number(params.get("pageSize") ?? 10);

  const page =
    Number.isSafeInteger(rawPage) && rawPage >= 1 && rawPage <= 100000
      ? rawPage
      : 1;

  const pageSize = PAGE_SIZES.find((size) => size === rawSize) ?? 10;

  const requestedSort = params.get("sortBy");

  const sortBy: TSort =
    requestedSort && sortKeys.includes(requestedSort as TSort)
      ? (requestedSort as TSort)
      : defaultSortBy;

  const sortDir: SortDirection =
    params.get("sortDir") === "desc" ? "desc" : "asc";

  const sorting: SortingState = [
    {
      id: sortBy,
      desc: sortDir === "desc",
    },
  ];

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(params);

    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }

    setParams(next);
  }

  function onPageSizeChange(size: number) {
    if (!PAGE_SIZES.some((value) => value === size)) {
      return;
    }

    const next = new URLSearchParams(params);

    if (size === 10) {
      next.delete("pageSize");
    } else {
      next.set("pageSize", String(size));
    }

    // Changing page size resets pagination.
    next.delete("page");
    setParams(next);
  }

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const nextSorting =
      typeof updater === "function" ? updater(sorting) : updater;

    const selected = nextSorting[0];

    const validSort = selected && sortKeys.includes(selected.id as TSort);

    const nextSortBy: TSort = validSort
      ? (selected.id as TSort)
      : defaultSortBy;

    const nextDirection: SortDirection =
      validSort && selected.desc ? "desc" : "asc";

    const next = new URLSearchParams(params);

    if (nextSortBy === defaultSortBy) {
      next.delete("sortBy");
    } else {
      next.set("sortBy", nextSortBy);
    }

    if (nextDirection === "asc") {
      next.delete("sortDir");
    } else {
      next.set("sortDir", nextDirection);
    }

    // A new sort always starts at page one.
    next.delete("page");
    setParams(next);
  };

  // Every list page uses the same URL filter semantics:
  // preserve sort/page-size, and return to page one when filters change.
  function setFilter(key: TFilter, value: string) {
    const next = new URLSearchParams(params);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    next.delete("page");
    setParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams(params);

    for (const key of filterKeys) {
      next.delete(key);
    }

    next.delete("page");
    setParams(next);
  }

  return {
    page,
    pageSize,
    sortBy,
    sortDir,
    sorting,
    goToPage,
    onPageSizeChange,
    onSortingChange,
    setFilter,
    clearFilters,
  };
}

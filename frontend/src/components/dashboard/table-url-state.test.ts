
import { describe, expect, it } from "vitest";
import { getTableUrlState } from "./table-url-state";


const sortKeys = ["name", "status", "priority"] as const;
const filterKeys = ["q", "status", "priority"] as const;

function setup(query = "") {
  const updates: URLSearchParams[] = [];

  const state = getTableUrlState({
    params: new URLSearchParams(query),
    setParams: (params) => {
      updates.push(params);
    },
    sortKeys,
    defaultSortBy: "name",
    filterKeys,
  });

  function updatedParams() {
    expect(updates).toHaveLength(1);
    return updates[0];
  }

  return {
    state,
    updates,
    updatedParams,
  };
}

describe("Shared table URL state", () => {

  it.each(["0", "-1", "1.5", "100001", "invalid"])(
    "falls back to page 1 for invalid page=%s",
    (page) => {
      const { state } = setup(`page=${page}`);

      expect(state.page).toBe(1);
    },
  );

  it("parses valid pagination and sorting parameters", () => {
    const { state } = setup(
      "page=3&pageSize=50&sortBy=status&sortDir=desc",
    );

    expect(state.page).toBe(3);
    expect(state.pageSize).toBe(50);
    expect(state.sortBy).toBe("status");
    expect(state.sortDir).toBe("desc");

    expect(state.sorting).toEqual([
      { id: "status", desc: true },
    ]);
  });

  it("uses safe defaults for unsupported page sizes and sorting", () => {
    const { state } = setup(
      "pageSize=25&sortBy=unknown&sortDir=invalid",
    );

    expect(state.pageSize).toBe(10);
    expect(state.sortBy).toBe("name");
    expect(state.sortDir).toBe("asc");

    expect(state.sorting).toEqual([
      { id: "name", desc: false },
    ]);
  });


  it("changes pages while preserving active filters", () => {
    const { state, updatedParams } = setup(
      "page=5&pageSize=20&status=active&q=portal",
    );

    state.goToPage(3);

    const next = updatedParams();

    expect(next.get("page")).toBe("3");
    expect(next.get("pageSize")).toBe("20");
    expect(next.get("status")).toBe("active");
    expect(next.get("q")).toBe("portal");
  });

  it("removes the page parameter when returning to page one", () => {
    const { state, updatedParams } = setup(
      "page=4&status=active",
    );

    state.goToPage(1);

    const next = updatedParams();

    expect(next.has("page")).toBe(false);
    expect(next.get("status")).toBe("active");
  });

  it("resets pagination when page size changes", () => {
    const { state, updatedParams } = setup(
      "page=5&pageSize=20&q=dashboard",
    );

    state.onPageSizeChange(50);

    const next = updatedParams();

    expect(next.get("pageSize")).toBe("50");
    expect(next.has("page")).toBe(false);
    expect(next.get("q")).toBe("dashboard");
  });

  it("ignores unsupported page sizes", () => {
    const { state, updates } = setup(
      "page=3&pageSize=20",
    );

    state.onPageSizeChange(999);

    expect(updates).toHaveLength(0);
  });

  it("updates sorting and resets pagination without removing filters", () => {
    const { state, updatedParams } = setup(
      "page=4&pageSize=20&q=portal&status=active",
    );

    
    state.onSortingChange(() => [
      { id: "priority", desc: true },
    ]);

    const next = updatedParams();

    expect(next.get("sortBy")).toBe("priority");
    expect(next.get("sortDir")).toBe("desc");
    expect(next.has("page")).toBe(false);

    expect(next.get("pageSize")).toBe("20");
    expect(next.get("q")).toBe("portal");
    expect(next.get("status")).toBe("active");
  });

  it("restores default sorting when given an unsupported column", () => {
    const { state, updatedParams } = setup(
      "page=3&sortBy=status&sortDir=desc",
    );

    state.onSortingChange([
      { id: "unknown-column", desc: true },
    ]);

    const next = updatedParams();

    expect(next.has("sortBy")).toBe(false);
    expect(next.has("sortDir")).toBe(false);
    expect(next.has("page")).toBe(false);
  });

  it("updates a filter and resets pagination", () => {
    const { state, updatedParams } = setup(
      "page=4&pageSize=20&sortBy=priority&q=portal",
    );

    state.setFilter("status", "active");

    const next = updatedParams();

    expect(next.get("status")).toBe("active");
    expect(next.has("page")).toBe(false);

    expect(next.get("pageSize")).toBe("20");
    expect(next.get("sortBy")).toBe("priority");
    expect(next.get("q")).toBe("portal");
  });

  it("removes a filter when its value is empty", () => {
    const { state, updatedParams } = setup(
      "page=3&status=active&q=portal",
    );

    state.setFilter("status", "");

    const next = updatedParams();

    expect(next.has("status")).toBe(false);
    expect(next.has("page")).toBe(false);
    expect(next.get("q")).toBe("portal");
  });

  it("clears registered filters while preserving sorting and page size", () => {
    const { state, updatedParams } = setup(
      "page=5&pageSize=50&q=portal&status=active&priority=high&sortBy=name&sortDir=desc&view=compact",
    );

    state.clearFilters();

    const next = updatedParams();

    expect(next.has("q")).toBe(false);
    expect(next.has("status")).toBe(false);
    expect(next.has("priority")).toBe(false);
    expect(next.has("page")).toBe(false);
    expect(next.get("pageSize")).toBe("50");
    expect(next.get("sortBy")).toBe("name");
    expect(next.get("sortDir")).toBe("desc");
    expect(next.get("view")).toBe("compact");
  });
});

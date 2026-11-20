import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination, usePagination } from "./Pagination";

describe("Pagination", () => {
  it("shows ten items per page and hides controls for ten or fewer", () => {
    const items = Array.from({ length: 11 }, (_, index) => index);
    const { result, rerender } = renderHook(({ data }) => usePagination(data), {
      initialProps: { data: items },
    });

    expect(result.current.items).toEqual(items.slice(0, 10));
    const view = render(<Pagination {...result.current} label="items" />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

    act(() => result.current.setPage(2));
    expect(result.current.items).toEqual([10]);

    rerender({ data: items.slice(0, 10) });
    expect(result.current.page).toBe(1);
    view.rerender(<Pagination {...result.current} label="items" />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

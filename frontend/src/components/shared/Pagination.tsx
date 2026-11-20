import { useState } from "react";

const pageSize = 10;

export function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  return {
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    page: currentPage,
    setPage,
    total: items.length,
    totalPages,
  };
}

export function Pagination({
  page,
  setPage,
  total,
  totalPages,
  label,
}: {
  page: number;
  setPage: (page: number) => void;
  total: number;
  totalPages: number;
  label: string;
}) {
  if (total <= pageSize) return null;

  return (
    <nav className="table-footer" aria-label={`${label} pagination`}>
      <span>
        {total} {label}
      </span>
      <div>
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

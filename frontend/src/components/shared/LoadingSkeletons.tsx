import type { CSSProperties } from "react";

type TableSkeletonProps = {
  label: string;
  columns?: number;
  rows?: number;
};

export function TableSkeleton({
  label,
  columns = 5,
  rows = 5,
}: TableSkeletonProps) {
  return (
    <div
      className="table-skeleton"
      role="status"
      aria-label={label}
      style={{ "--skeleton-columns": columns } as CSSProperties}
    >
      <div className="table-skeleton-head" aria-hidden="true">
        {Array.from({ length: columns }, (_, columnIndex) => (
          <span key={columnIndex} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="table-skeleton-row" aria-hidden="true" key={rowIndex}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <span key={columnIndex} />
          ))}
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

type CardSkeletonGridProps = {
  label: string;
  cards?: number;
};

export function CardSkeletonGrid({ label, cards = 4 }: CardSkeletonGridProps) {
  return (
    <div className="stats-row" role="status" aria-label={label}>
      {Array.from({ length: cards }, (_, cardIndex) => (
        <div className="stat-skeleton" aria-hidden="true" key={cardIndex}>
          <span />
          <span />
          <span />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="panel-skeleton" role="status" aria-label={label}>
      <span />
      <span />
      <span />
      <span />
      <span className="sr-only">{label}</span>
    </div>
  );
}

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, pageSize, total, onPage }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-950/5">
      <p className="text-xs text-zinc-500">
        Showing <span className="font-medium">{from}–{to}</span> of{" "}
        <span className="font-medium">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-1">
        <PageBtn
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous"
        >
          <ChevronLeft className="size-3.5" />
        </PageBtn>
        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          let p: number;
          if (totalPages <= 5) {
            p = i + 1;
          } else if (page <= 3) {
            p = i + 1;
          } else if (page >= totalPages - 2) {
            p = totalPages - 4 + i;
          } else {
            p = page - 2 + i;
          }
          return (
            <PageBtn key={p} onClick={() => onPage(p)} active={p === page}>
              {p}
            </PageBtn>
          );
        })}
        <PageBtn
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next"
        >
          <ChevronRight className="size-3.5" />
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
  active,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "size-7 flex items-center justify-center text-xs rounded-md transition-colors",
        active
          ? "bg-brand text-white font-medium"
          : "text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

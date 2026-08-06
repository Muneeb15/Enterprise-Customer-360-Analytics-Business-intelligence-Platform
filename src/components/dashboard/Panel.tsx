import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "bg-surface ring-1 ring-black/5 rounded-xl flex flex-col overflow-hidden",
        className,
      )}
    >
      {title && (
        <div className="px-6 py-4 border-b border-zinc-950/5 flex justify-between items-center gap-4">
          <h2 className="text-sm font-medium text-zinc-900">{title}</h2>
          {action}
        </div>
      )}
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
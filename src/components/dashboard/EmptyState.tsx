import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <Icon className="size-5 text-zinc-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

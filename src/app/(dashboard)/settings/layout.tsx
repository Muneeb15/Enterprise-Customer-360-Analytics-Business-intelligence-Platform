"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Organization", href: "/settings/org" },
  { label: "Users & Roles", href: "/settings/users" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div className="px-8 pt-8 pb-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Workspace configuration</p>
      </div>
      <div className="px-8 pb-10 space-y-6">
        <div className="flex gap-1 border-b border-zinc-950/5 -mt-2">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "px-3 py-2 text-sm border-b-2 -mb-px transition-colors " +
                  (active
                    ? "border-brand text-zinc-900 font-medium"
                    : "border-transparent text-zinc-500 hover:text-zinc-900")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        {children}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import Link from "next/link";

const DEFAULT_PREFS = [
  { key: "email_notif",  label: "Email notifications",  sub: "Receive alerts for import completion and churn events", enabled: true },
  { key: "weekly_digest",label: "Weekly digest",         sub: "Summary of KPI changes delivered every Monday",        enabled: true },
  { key: "security",     label: "Security alerts",       sub: "Login from new device or location",                    enabled: true },
  { key: "product_updates",label:"Product updates",     sub: "New features and improvements",                         enabled: false },
];

export default function ProfilePage() {
  const { user } = useUser();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => {
    setPrefs((p) => p.map((pref) => pref.key === key ? { ...pref, enabled: !pref.enabled } : pref));
    setSaved(false);
  };

  const save = () => {
    // In production: persist to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || "?"
    : "?";

  const displayName = user?.fullName ?? user?.username ?? "User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account and preferences" />
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account card */}
          <Panel title="Account" bodyClassName="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              {user?.imageUrl ? (
                <Image src={user.imageUrl} alt={displayName} width={64} height={64} className="size-16 rounded-full mb-3 ring-2 ring-brand/20" />
              ) : (
                <div className="size-16 bg-brand/10 rounded-full flex items-center justify-center text-xl font-semibold text-brand mb-3">
                  {initials}
                </div>
              )}
              <h3 className="text-sm font-semibold text-zinc-900">{displayName}</h3>
              {email && <p className="text-xs text-zinc-500">{email}</p>}
              <span className="mt-2 text-[10px] font-semibold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
            <div className="space-y-3">
              {[
                { label: "Member since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—" },
                { label: "Last active",  value: "Now" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs py-2 border-b border-zinc-950/5 last:border-0">
                  <span className="text-zinc-500">{row.label}</span>
                  <span className="font-medium text-zinc-800">{row.value}</span>
                </div>
              ))}
            </div>
            <Link href="/settings/org"
              className="mt-4 w-full text-center block text-xs font-medium text-brand hover:underline">
              Manage organization →
            </Link>
          </Panel>

          {/* Preferences */}
          <Panel title="Preferences" className="lg:col-span-2" bodyClassName="p-6">
            <div className="space-y-5">
              {prefs.map((pref) => (
                <div key={pref.key} className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{pref.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{pref.sub}</p>
                  </div>
                  <button
                    onClick={() => toggle(pref.key)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${pref.enabled ? "bg-brand" : "bg-zinc-200"}`}
                    aria-pressed={pref.enabled}
                  >
                    <span
                      className={`inline-block size-4 mt-0.5 rounded-full bg-white shadow transition-transform duration-200 ${pref.enabled ? "translate-x-4" : "translate-x-0.5"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={save}
                className="text-sm font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-4 rounded-md hover:opacity-90 transition-opacity">
                Save preferences
              </button>
              {saved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

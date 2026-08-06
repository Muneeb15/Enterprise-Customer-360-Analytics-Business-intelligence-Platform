"use client";

import { useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CheckCircle } from "lucide-react";

export default function OrgSettings() {
  const { organization } = useOrganization();
  const { user } = useUser();
  const [saved, setSaved] = useState(false);

  const orgName = organization?.name ?? user?.fullName ?? "My Workspace";
  const orgSlug = organization?.slug ?? "my-workspace";

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <PageHeader title="Organization" subtitle="Workspace configuration and billing" />
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Organization" className="lg:col-span-2" bodyClassName="p-6 space-y-5">
            <Field label="Organization name"   value={orgName} />
            <Field label="Workspace URL"       value={`${orgSlug}.nexus.app`} mono />
            <Field label="Default currency"    value="USD" />
            <Field label="Fiscal year start"   value="January" />
            <Field label="Data retention"      value="36 months" />
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={save}
                className="text-sm font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-4 rounded-md hover:opacity-90 transition-opacity"
              >
                Save changes
              </button>
              {saved && (
                <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                  <CheckCircle className="size-3.5" /> Saved
                </span>
              )}
            </div>
          </Panel>

          <Panel title="Billing" bodyClassName="p-6 space-y-3">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Current plan</p>
            <p className="text-xl font-semibold tracking-tight">Enterprise</p>
            <p className="text-sm text-zinc-500">Renews Jan 12, 2026 · $48,000 / yr · 50 seat allowance</p>
            <a
              href="https://billing.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium ring-1 ring-zinc-950/10 py-1.5 px-3 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Manage billing ↗
            </a>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 items-center gap-4 py-2 border-b border-zinc-950/5 last:border-0">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span className={"col-span-2 text-sm text-zinc-900 " + (mono ? "font-mono tabular-nums" : "")}>
        {value}
      </span>
    </div>
  );
}

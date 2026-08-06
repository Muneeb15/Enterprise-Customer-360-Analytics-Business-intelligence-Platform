import type { Metadata } from "next";
import { Building2, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const metadata: Metadata = { title: "Organizations" };

const ORGS = [
  { id: "org_acme", name: "Acme Global", plan: "Enterprise", members: 5, customers: 150, created: "Jan 2021" },
  { id: "org_beta", name: "Beta Corp", plan: "Pro", members: 2, customers: 32, created: "Mar 2023" },
];

export default function OrganizationsPage() {
  return (
    <>
      <PageHeader
        title="Organizations"
        subtitle="Manage workspaces and their access"
        action={
          <button className="text-xs font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md hover:opacity-90 inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> New Organization
          </button>
        }
      />
      <div className="px-8 py-6">
        <Panel>
          {ORGS.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No organizations yet"
              description="Create your first workspace to get started"
            />
          ) : (
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-950/5">
                <tr>
                  {["Organization", "Plan", "Members", "Customers", "Created"].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider${i > 1 ? " text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/5">
                {ORGS.map((org) => (
                  <tr key={org.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-brand/10 rounded-md flex items-center justify-center">
                          <Building2 className="size-4 text-brand" strokeWidth={1.75} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{org.name}</p>
                          <p className="text-xs text-zinc-400 font-mono">{org.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${org.plan === "Enterprise" ? "bg-brand/10 text-brand" : "bg-zinc-100 text-zinc-600"}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-right tabular-nums text-zinc-600">{org.members}</td>
                    <td className="px-6 py-4 text-sm font-mono text-right tabular-nums text-zinc-600">{org.customers.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-right text-zinc-500">{org.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </>
  );
}

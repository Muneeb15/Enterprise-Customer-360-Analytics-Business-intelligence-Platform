"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Panel } from "@/components/dashboard/Panel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Plus, X, CheckCircle, Loader2 } from "lucide-react";

export default function UsersSettings() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Viewer");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: api.getTeamMembers,
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    // Simulate invite (replace with real API call when backend supports it)
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSuccess(true);
    setEmail("");
    setTimeout(() => {
      setSuccess(false);
      setInviteOpen(false);
      qc.invalidateQueries({ queryKey: ["team-members"] });
    }, 1500);
  };

  return (
    <>
      <PageHeader
        title="Team Members"
        subtitle={`${teamMembers.length} members in this workspace`}
        action={
          <button
            onClick={() => setInviteOpen(true)}
            className="text-xs font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md inline-flex items-center gap-1.5 hover:opacity-90"
          >
            <Plus className="size-3" /> Invite member
          </button>
        }
      />

      <div className="px-8 py-6">
        {/* Invite modal */}
        {inviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
            <div className="relative bg-surface w-full max-w-md mx-4 rounded-2xl shadow-2xl ring-1 ring-black/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Invite team member</h2>
                <button onClick={() => setInviteOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                  <X className="size-4" />
                </button>
              </div>
              {success ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <CheckCircle className="size-8 text-emerald-500" />
                  <p className="text-sm font-medium text-zinc-800">Invitation sent!</p>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 mb-1 block">Email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full text-sm bg-zinc-50 ring-1 ring-black/10 rounded-md px-3 py-2 focus:ring-brand/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 mb-1 block">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-sm bg-zinc-50 ring-1 ring-black/10 rounded-md px-3 py-2 focus:outline-none"
                    >
                      <option>Admin</option>
                      <option>Analyst</option>
                      <option>Viewer</option>
                    </select>
                  </div>
                  {error && <p className="text-xs text-rose-600">{error}</p>}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setInviteOpen(false)}
                      className="flex-1 text-sm text-zinc-600 ring-1 ring-black/10 py-1.5 rounded-md hover:bg-zinc-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 text-sm font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 rounded-md hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                      {loading && <Loader2 className="size-3.5 animate-spin" />}
                      Send invite
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <Panel title={`Team members · ${teamMembers.length}`}>
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-950/5">
              <tr>
                {["User", "Email", "Role", "Last active"].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider${i === 3 ? " text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {teamMembers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-7 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-medium text-zinc-500">
                        {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-zinc-600">{u.email}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 ring-1 ring-zinc-950/5">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-zinc-500 text-right">{u.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}

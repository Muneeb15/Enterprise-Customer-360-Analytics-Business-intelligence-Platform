"use client";

import { useState, useMemo } from "react";
import type { Metadata } from "next";
import { GitBranch, Star, Search, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";

const PROFILES = [
  { id: "gh1", username: "sarahchen",   name: "Sarah Chen",   avatar: "SC", repos: 48,  stars: 312,  followers: 892,  languages: ["TypeScript", "Python", "Go"],          score: 96, activity: "Very Active", lastCommit: "2h ago" },
  { id: "gh2", username: "marcuswebb", name: "Marcus Webb",  avatar: "MW", repos: 23,  stars: 145,  followers: 310,  languages: ["JavaScript", "CSS"],                    score: 78, activity: "Active",      lastCommit: "3 days ago" },
  { id: "gh3", username: "priyanair",  name: "Priya Nair",   avatar: "PN", repos: 67,  stars: 1240, followers: 2100, languages: ["Python", "Jupyter", "SQL"],              score: 98, activity: "Very Active", lastCommit: "4h ago" },
  { id: "gh4", username: "jamesokafor",name: "James Okafor", avatar: "JO", repos: 31,  stars: 88,   followers: 145,  languages: ["AWS", "Terraform", "Bash"],              score: 82, activity: "Active",      lastCommit: "1 day ago" },
  { id: "gh5", username: "danakim",    name: "Dana Kim",     avatar: "DK", repos: 14,  stars: 42,   followers: 76,   languages: ["Python", "R"],                           score: 71, activity: "Moderate",    lastCommit: "2 weeks ago" },
];

const activityColor: Record<string, string> = {
  "Very Active": "text-emerald-600 bg-emerald-50",
  "Active":      "text-brand bg-brand/10",
  "Moderate":    "text-amber-600 bg-amber-50",
  "Inactive":    "text-zinc-500 bg-zinc-100",
};

export default function GithubPage() {
  const [q, setQ] = useState("");
  const [analyzeUsername, setAnalyzeUsername] = useState("");

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    if (!search) return PROFILES;
    return PROFILES.filter((p) =>
      p.name.toLowerCase().includes(search) || p.username.toLowerCase().includes(search)
    );
  }, [q]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (analyzeUsername.trim()) {
      window.open(`https://github.com/${analyzeUsername.trim()}`, "_blank");
      setAnalyzeUsername("");
    }
  };

  return (
    <>
      <PageHeader
        title="GitHub Analysis"
        subtitle="Profile analysis and contribution scoring"
        action={
          <form onSubmit={handleAnalyze} className="flex gap-2">
            <input
              value={analyzeUsername}
              onChange={(e) => setAnalyzeUsername(e.target.value)}
              placeholder="GitHub username…"
              className="text-xs bg-zinc-100 ring-1 ring-black/5 rounded-md px-3 py-1.5 w-40 focus:outline-none focus:ring-brand/40"
            />
            <button type="submit"
              className="text-xs font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md hover:opacity-90 inline-flex items-center gap-1.5">
              <Plus className="size-3.5" /> Analyze
            </button>
          </form>
        }
      />

      <div className="px-8 py-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="size-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search profiles…"
            className="w-full text-sm bg-surface ring-1 ring-black/5 rounded-md pl-8 pr-3 py-1.5 focus:ring-brand/40 focus:outline-none"
          />
        </div>

        <Panel>
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-950/5">
              <tr>
                {["Profile", "Languages", "Repos", "Stars", "Activity", "Score", "Last Commit"].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider${i >= 2 && i <= 4 ? " text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-brand/10 rounded-full flex items-center justify-center text-[10px] font-semibold text-brand">{p.avatar}</div>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <a href={`https://github.com/${p.username}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-zinc-400 font-mono hover:text-brand">@{p.username}</a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {p.languages.map((l) => (
                        <span key={l} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded font-medium">{l}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono tabular-nums text-right text-zinc-600">{p.repos}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-mono tabular-nums text-zinc-600 inline-flex items-center gap-1">
                      <Star className="size-3 text-amber-400 fill-amber-400" />{p.stars}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${activityColor[p.activity] ?? "text-zinc-500 bg-zinc-100"}`}>{p.activity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-lg font-mono font-bold tabular-nums ${p.score >= 90 ? "text-emerald-600" : p.score >= 80 ? "text-brand" : "text-amber-600"}`}>{p.score}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400 text-right">{p.lastCommit}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-400">No profiles match "{q}"</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}

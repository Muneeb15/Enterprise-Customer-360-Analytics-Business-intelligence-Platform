"use client";

import { useState, useMemo, useRef } from "react";
import type { Metadata } from "next";
import { BookOpen, Upload, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { EmptyState } from "@/components/dashboard/EmptyState";

const RESUMES = [
  { id: "r1", name: "Sarah Chen",   role: "Senior Engineer",    skills: ["React", "TypeScript", "Node.js"], score: 94, uploaded: "2 days ago" },
  { id: "r2", name: "Marcus Webb",  role: "Product Manager",    skills: ["Strategy", "Analytics", "Agile"], score: 88, uploaded: "3 days ago" },
  { id: "r3", name: "Priya Nair",   role: "Data Scientist",     skills: ["Python", "ML", "SQL"],             score: 91, uploaded: "5 days ago" },
  { id: "r4", name: "James Okafor", role: "DevOps Engineer",    skills: ["AWS", "Docker", "Kubernetes"],     score: 85, uploaded: "1 week ago" },
];

export default function ResumesPage() {
  const [q, setQ] = useState("");
  const [resumes, setResumes] = useState(RESUMES);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    if (!search) return resumes;
    return resumes.filter((r) =>
      r.name.toLowerCase().includes(search) || r.role.toLowerCase().includes(search)
    );
  }, [q, resumes]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // In production: POST to /api/resumes with the file
    const newResume = {
      id: `r_${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      role: "Pending AI Analysis",
      skills: ["Uploaded"],
      score: Math.floor(Math.random() * 20) + 75,
      uploaded: "Just now",
    };
    setResumes((rs) => [newResume, ...rs]);
    e.target.value = "";
  };

  return (
    <>
      <PageHeader
        title="Resume Library"
        subtitle="Uploaded resumes and AI match scores"
        action={
          <>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Upload className="size-3.5" /> Upload Resume
            </button>
          </>
        }
      />
      <div className="px-8 py-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="size-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or role…"
            className="w-full text-sm bg-surface ring-1 ring-black/5 rounded-md pl-8 pr-3 py-1.5 focus:ring-brand/40 focus:outline-none"
          />
        </div>

        {filtered.length === 0 && q ? (
          <Panel>
            <EmptyState icon={BookOpen} title="No results" description={`No resumes match "${q}"`} />
          </Panel>
        ) : filtered.length === 0 ? (
          <Panel>
            <EmptyState
              icon={BookOpen}
              title="No resumes yet"
              description="Upload resumes to start building your talent library"
              action={
                <button onClick={() => fileRef.current?.click()}
                  className="text-xs font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md hover:opacity-90">
                  Upload Resume
                </button>
              }
            />
          </Panel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <div key={r.id} className="bg-surface ring-1 ring-black/5 rounded-xl p-5 hover:ring-zinc-300 transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="size-10 bg-brand/10 rounded-full flex items-center justify-center text-sm font-semibold text-brand">
                    {r.name.split(" ").map((p) => p[0]).join("")}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Score</div>
                    <div className={`text-lg font-mono font-bold tabular-nums ${r.score >= 90 ? "text-emerald-600" : r.score >= 80 ? "text-brand" : "text-amber-600"}`}>
                      {r.score}
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-brand transition-colors">{r.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{r.role}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {r.skills.map((s) => (
                    <span key={s} className="text-[10px] font-medium px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">{s}</span>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 mt-3">Uploaded {r.uploaded}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

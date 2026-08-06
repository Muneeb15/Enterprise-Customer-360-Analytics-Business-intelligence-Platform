"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { X, Loader2, CheckCircle } from "lucide-react";

const SEGMENTS = [
  "Enterprise Growth", "Mid-Market Stable", "SMB High Churn",
  "New / Onboarding", "Dormant",
];
const REGIONS = ["North America", "Europe", "APAC", "LATAM"];

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY = {
  name: "", email: "", mrr: "", ltv: "",
  segment: "New / Onboarding", region: "North America",
  status: "Active" as "Active" | "At Risk" | "Churned",
  joined: new Date().toISOString().split("T")[0],
};

export function AddCustomerModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      api.createCustomer({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        mrr: parseInt(form.mrr) || 0,
        ltv: parseInt(form.ltv) || 0,
        segment: form.segment,
        region: form.region,
        status: form.status,
        joined: form.joined || undefined,
      }),
    onSuccess: () => {
      // Invalidate all customer queries so the table refreshes instantly
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["segments"] });
      qc.invalidateQueries({ queryKey: ["kpis"] });
      qc.invalidateQueries({ queryKey: ["customer-analytics"] });
      setTimeout(() => {
        setForm({ ...EMPTY });
        setErrors({});
        onClose();
      }, 1200);
    },
    onError: (err: Error) => {
      setErrors({ _global: err.message });
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (form.mrr && isNaN(parseInt(form.mrr))) e.mrr = "Must be a number";
    if (form.ltv && isNaN(parseInt(form.ltv))) e.ltv = "Must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface w-full max-w-lg mx-4 rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-950/5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Add Customer</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Create a new customer record manually</p>
          </div>
          <button onClick={onClose} className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100">
            <X className="size-4" />
          </button>
        </div>

        {/* Success state */}
        {mutation.isSuccess && (
          <div className="flex flex-col items-center py-12 gap-3">
            <CheckCircle className="size-10 text-emerald-500" />
            <p className="text-sm font-semibold text-zinc-800">Customer added!</p>
            <p className="text-xs text-zinc-500">The customer list has been updated.</p>
          </div>
        )}

        {/* Form */}
        {!mutation.isSuccess && (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <Field label="Customer Name" required error={errors.name}>
                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Acme Corp" className={input(errors.name)} />
              </Field>

              {/* Email */}
              <Field label="Email" error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="contact@acmecorp.com" className={input(errors.email)} />
              </Field>

              {/* MRR + LTV */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="MRR ($)" error={errors.mrr}>
                  <input type="number" min="0" value={form.mrr} onChange={(e) => set("mrr", e.target.value)}
                    placeholder="0" className={input(errors.mrr)} />
                </Field>
                <Field label="Lifetime Value ($)" error={errors.ltv}>
                  <input type="number" min="0" value={form.ltv} onChange={(e) => set("ltv", e.target.value)}
                    placeholder="0" className={input(errors.ltv)} />
                </Field>
              </div>

              {/* Segment + Region */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Segment">
                  <select value={form.segment} onChange={(e) => set("segment", e.target.value)} className={input()}>
                    {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Region">
                  <select value={form.region} onChange={(e) => set("region", e.target.value)} className={input()}>
                    {REGIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </div>

              {/* Status + Joined */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Status">
                  <select value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)} className={input()}>
                    <option>Active</option>
                    <option>At Risk</option>
                    <option>Churned</option>
                  </select>
                </Field>
                <Field label="Joined Date">
                  <input type="date" value={form.joined} onChange={(e) => set("joined", e.target.value)} className={input()} />
                </Field>
              </div>

              {errors._global && (
                <p className="text-xs text-rose-600 bg-rose-50 ring-1 ring-rose-200 rounded-md px-3 py-2">
                  {errors._global}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-950/5 flex justify-end gap-3">
              <button type="button" onClick={onClose}
                className="text-sm text-zinc-600 ring-1 ring-black/10 py-1.5 px-4 rounded-md hover:bg-zinc-50">
                Cancel
              </button>
              <button type="submit" disabled={mutation.isPending}
                className="text-sm font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-4 rounded-md hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
                {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                {mutation.isPending ? "Saving…" : "Add Customer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-700 mb-1 block">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

function input(error?: string) {
  return `w-full text-sm bg-zinc-50 ring-1 ${error ? "ring-rose-300" : "ring-black/10"} rounded-md px-3 py-2 focus:outline-none focus:ring-brand/40 focus:bg-white transition-colors`;
}

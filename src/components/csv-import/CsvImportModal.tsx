"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ColumnMapping,
  CsvPreviewResponse,
  ImportField,
  ImportResult,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";

// ── Step type ────────────────────────────────────────────────────────────────

type Step = "upload" | "map" | "importing" | "done";

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

// ── Main component ───────────────────────────────────────────────────────────

export function CsvImportModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<CsvPreviewResponse | null>(null);
  const [fileName, setFileName] = useState<string>("imported.csv");
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: fields = [] } = useQuery<ImportField[]>({
    queryKey: ["import-fields"],
    queryFn: api.getImportFields,
    enabled: open,
  });

  const previewMutation = useMutation({
    mutationFn: (file: File) => api.previewCsv(file),
    onSuccess: (data) => {
      setPreview(data);
      // Auto-map columns whose names match field keys/labels (case-insensitive)
      const auto: Record<string, string> = {};
      for (const header of data.headers) {
        const norm = header.toLowerCase().replace(/[\s_-]+/g, "");
        const matched = fields.find(
          (f) =>
            f.key === norm ||
            f.label.toLowerCase().replace(/[\s_-]+/g, "") === norm,
        );
        auto[header] = matched ? matched.key : "__skip__";
      }
      setMappings(auto);
      setStep("map");
    },
    onError: (err: Error) => setFileError(err.message),
  });

  const importMutation = useMutation({
    mutationFn: () =>
      api.importCustomers(
        preview!.file_id,
        Object.entries(mappings).map(([csv_column, target_field]) => ({
          csv_column,
          target_field,
        })),
        fileName,
      ),
    onSuccess: (data) => {
      setResult(data);
      setStep("done");
      if (data.imported > 0) {
        // Invalidate all customer-related queries so dashboard updates instantly
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["segments"] });
        qc.invalidateQueries({ queryKey: ["kpis"] });
        qc.invalidateQueries({ queryKey: ["regions"] });
      }
    },
    onError: (err: Error) => {
      setResult({
        imported: 0,
        skipped: 0,
        rollback: true,
        errors: [{ row: 0, column: null, message: err.message }],
      });
      setStep("done");
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      setFileError(null);
      setFileName(file.name);
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setFileError("Only .csv files are accepted");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError("File is too large (max 10 MB)");
        return;
      }
      previewMutation.mutate(file);
    },
    [previewMutation],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const reset = () => {
    setStep("upload");
    setPreview(null);
    setMappings({});
    setResult(null);
    setFileError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-surface w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-950/5 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Import Customers</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {step === "upload" && "Upload a CSV file to import customers"}
              {step === "map" && `Map ${preview?.total_rows.toLocaleString()} rows to customer fields`}
              {step === "importing" && "Importing your data…"}
              {step === "done" && "Import complete"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {step === "upload" && (
            <UploadStep
              dragOver={dragOver}
              setDragOver={setDragOver}
              onDrop={handleDrop}
              onFile={handleFile}
              loading={previewMutation.isPending}
              error={fileError}
              fileRef={fileRef}
            />
          )}

          {step === "map" && preview && (
            <MapStep
              preview={preview}
              fields={fields}
              mappings={mappings}
              onChange={setMappings}
            />
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="size-8 animate-spin text-brand" />
              <p className="text-sm text-zinc-600">
                Importing {preview?.total_rows.toLocaleString()} rows…
              </p>
            </div>
          )}

          {step === "done" && result && <DoneStep result={result} onReset={reset} />}
        </div>

        {/* Footer */}
        {(step === "map" || step === "upload") && (
          <div className="px-6 py-4 border-t border-zinc-950/5 flex items-center justify-between shrink-0">
            <button
              onClick={step === "map" ? reset : handleClose}
              className="text-sm text-zinc-500 hover:text-zinc-800"
            >
              {step === "map" ? "← Back" : "Cancel"}
            </button>
            {step === "map" && (
              <button
                onClick={() => {
                  setStep("importing");
                  importMutation.mutate();
                }}
                disabled={!Object.values(mappings).some((v) => v !== "__skip__")}
                className="text-sm font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-4 rounded-md hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                Import {preview?.total_rows.toLocaleString()} rows
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step: Upload ─────────────────────────────────────────────────────────────

function UploadStep({
  dragOver,
  setDragOver,
  onDrop,
  onFile,
  loading,
  error,
  fileRef,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFile: (f: File) => void;
  loading: boolean;
  error: string | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors",
          dragOver
            ? "border-brand bg-brand/5"
            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50",
          loading && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
        {loading ? (
          <Loader2 className="size-8 animate-spin text-brand" />
        ) : (
          <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center">
            <Upload className="size-5 text-zinc-500" />
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700">
            {loading ? "Parsing file…" : "Drop CSV file here or click to browse"}
          </p>
          <p className="text-xs text-zinc-400 mt-1">CSV · UTF-8 · max 10 MB</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 rounded-md px-3 py-2 ring-1 ring-rose-200">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Expected columns (order doesn&apos;t matter)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["name*", "email", "mrr", "ltv", "segment", "region", "status", "joined"].map((f) => (
            <span
              key={f}
              className="text-[10px] font-mono px-2 py-0.5 bg-white ring-1 ring-zinc-200 rounded text-zinc-600"
            >
              {f}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400">* required</p>
      </div>
    </div>
  );
}

// ── Step: Column Mapping ─────────────────────────────────────────────────────

function MapStep({
  preview,
  fields,
  mappings,
  onChange,
}: {
  preview: CsvPreviewResponse;
  fields: ImportField[];
  mappings: Record<string, string>;
  onChange: (m: Record<string, string>) => void;
}) {
  const fieldOptions = [
    { key: "__skip__", label: "— Skip this column —" },
    ...fields,
  ];

  return (
    <div className="space-y-6">
      {/* Column mapping table */}
      <div>
        <p className="text-xs font-medium text-zinc-700 mb-3">Map CSV columns to customer fields</p>
        <div className="space-y-2">
          {preview.headers.map((header) => (
            <div key={header} className="grid grid-cols-2 gap-3 items-center">
              <div className="flex items-center gap-2">
                <FileText className="size-3.5 text-zinc-400 shrink-0" />
                <span className="text-sm font-mono text-zinc-700 truncate">{header}</span>
              </div>
              <select
                value={mappings[header] ?? "__skip__"}
                onChange={(e) => onChange({ ...mappings, [header]: e.target.value })}
                className="text-xs bg-white border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand/50 text-zinc-700"
              >
                {fieldOptions.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                    {"required" in f && f.required ? " *" : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Preview table */}
      <div>
        <p className="text-xs font-medium text-zinc-700 mb-3">
          Preview — first {preview.preview_rows.length} of {preview.total_rows.toLocaleString()} rows
        </p>
        <div className="overflow-x-auto rounded-lg ring-1 ring-zinc-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                {preview.headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-medium text-zinc-500 whitespace-nowrap">
                    {h}
                    <span className="ml-1 text-[9px] text-brand">
                      {mappings[h] && mappings[h] !== "__skip__"
                        ? `→ ${mappings[h]}`
                        : ""}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {preview.preview_rows.slice(0, 5).map((row) => (
                <tr key={row.row} className="hover:bg-zinc-50">
                  {preview.headers.map((h) => (
                    <td key={h} className="px-3 py-2 text-zinc-600 font-mono whitespace-nowrap max-w-[160px] truncate">
                      {row.data[h] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Step: Done ────────────────────────────────────────────────────────────────

function DoneStep({
  result,
  onReset,
}: {
  result: ImportResult;
  onReset: () => void;
}) {
  const hasErrors = result.errors.length > 0;
  const success = result.imported > 0 && !result.rollback;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div
        className={cn(
          "rounded-xl p-5 ring-1 flex items-start gap-4",
          success
            ? "bg-emerald-50 ring-emerald-200"
            : result.rollback
              ? "bg-rose-50 ring-rose-200"
              : "bg-amber-50 ring-amber-200",
        )}
      >
        <div className="mt-0.5">
          {success ? (
            <CheckCircle className="size-5 text-emerald-600" />
          ) : result.rollback ? (
            <AlertCircle className="size-5 text-rose-600" />
          ) : (
            <AlertTriangle className="size-5 text-amber-600" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {success
              ? `${result.imported.toLocaleString()} customer${result.imported === 1 ? "" : "s"} imported`
              : result.rollback
                ? "Import failed — no records were saved"
                : "Import complete with warnings"}
          </p>
          <div className="mt-1.5 flex gap-4 text-xs text-zinc-600">
            <span className="text-emerald-700 font-medium">
              ✓ {result.imported} imported
            </span>
            {result.skipped > 0 && (
              <span className="text-amber-700 font-medium">
                ⊘ {result.skipped} skipped (duplicates)
              </span>
            )}
            {result.errors.length > 0 && (
              <span className="text-rose-700 font-medium">
                ✕ {result.errors.length} errors
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error list */}
      {hasErrors && (
        <div>
          <p className="text-xs font-medium text-zinc-700 mb-2">Errors</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {result.errors.map((err, i) => (
              <div
                key={i}
                className="text-xs bg-rose-50 ring-1 ring-rose-200 rounded-md px-3 py-2 flex items-start gap-2"
              >
                <span className="font-mono text-rose-500 shrink-0">
                  {err.row > 0 ? `Row ${err.row}` : "General"}
                  {err.column ? ` · ${err.column}` : ""}
                </span>
                <span className="text-rose-800">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {result.rollback && (
          <button
            onClick={onReset}
            className="text-sm font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-4 rounded-md hover:opacity-90"
          >
            Try again
          </button>
        )}
        {success && (
          <p className="text-xs text-zinc-500 self-center">
            The customer list and dashboard have been updated automatically.
          </p>
        )}
      </div>
    </div>
  );
}

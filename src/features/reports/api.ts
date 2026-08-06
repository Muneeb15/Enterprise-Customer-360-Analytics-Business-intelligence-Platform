"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useGenerateReport(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.generateReport(reportId),
    onSuccess: (data) => {
      qc.setQueryData(["job", data.job_id], data);
    },
  });
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "running" ? 1000 : false;
    },
  });
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Job } from "@/lib/types";

interface UseJobsParams {
  search?: string;
  min_score?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export function useJobs(params: UseJobsParams = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set("search", params.search);
      if (params.min_score !== undefined) searchParams.set("min_score", String(params.min_score));
      if (params.status) searchParams.set("status", params.status);
      if (params.limit) searchParams.set("limit", String(params.limit));
      if (params.offset) searchParams.set("offset", String(params.offset));

      const res = await fetch(`/api/jobs?${searchParams}`);
      if (res.ok) setJobs(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.search, params.min_score, params.status, params.limit, params.offset]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { jobs, loading, refresh };
}

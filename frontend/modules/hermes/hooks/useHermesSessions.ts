"use client";

import { useQuery } from "@tanstack/react-query";
import * as hermesApi from "../services/hermes.api";
import type { HermesSession, HermesProject, SessionStatus } from "../types/hermes.types";

type SessionsParams = {
  status?: SessionStatus;
  page?: number;
  pageSize?: number;
  sortBy?: keyof HermesSession;
  sortOrder?: "asc" | "desc";
};

export function useHermesSessions(params: SessionsParams = {}) {
  const query = useQuery({
    queryKey: ["hermes", "sessions", params],
    queryFn: () => hermesApi.getSessions(params),
    staleTime: 60_000,
    retry: 1,
  });

  const sessions: HermesSession[] = query.data?.data ?? [];
  const total: number = query.data?.total ?? 0;
  const projects: HermesProject[] = query.data?.projects ?? [];

  return { sessions, total, projects, query };
}

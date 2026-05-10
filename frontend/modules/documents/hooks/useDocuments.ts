"use client";

import { useQuery } from "@tanstack/react-query";

import { documentApi } from "../services/document.api";

export function useDocuments(params?: { keyword?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["documents", "list", params?.keyword ?? "", params?.page ?? 1, params?.pageSize ?? 20],
    queryFn: () => documentApi.listDocuments(params),
  });
}


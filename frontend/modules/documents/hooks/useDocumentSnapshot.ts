"use client";

import { useQuery } from "@tanstack/react-query";

import { documentApi } from "../services/document.api";

export function useDocumentSnapshot(documentId: string) {
  return useQuery({
    queryKey: ["documents", "snapshot", documentId],
    queryFn: () => documentApi.getSnapshot(documentId),
  });
}


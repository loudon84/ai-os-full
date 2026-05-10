"use client";

import { useQuery } from "@tanstack/react-query";

import { documentApi } from "../services/document.api";

export function useDocumentDetail(documentId: string) {
  return useQuery({
    queryKey: ["documents", "detail", documentId],
    queryFn: () => documentApi.getDocument(documentId),
  });
}


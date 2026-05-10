"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { documentApi } from "../services/document.api";

export function useDocumentCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string }) => documentApi.createDocument({ title: input.title }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["documents", "list"] });
    },
  });
}


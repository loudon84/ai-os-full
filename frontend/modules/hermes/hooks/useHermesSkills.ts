"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as hermesApi from "../services/hermes.api";
import type { HermesSkill, SkillSource } from "../types/hermes.types";

type SkillsParams = {
  source?: SkillSource;
  enabled?: boolean;
};

export function useHermesSkills(params: SkillsParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["hermes", "skills", params],
    queryFn: () => hermesApi.getSkills(params),
    staleTime: 60_000,
    retry: 1,
  });

  const skills: HermesSkill[] = query.data ?? [];

  const reloadMutation = useMutation({
    mutationFn: () => hermesApi.reloadSkills(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hermes", "skills"] });
    },
  });

  const reload = async () => {
    await reloadMutation.mutateAsync();
  };

  const isReloading = reloadMutation.isPending;

  return { skills, query, reload, isReloading };
}

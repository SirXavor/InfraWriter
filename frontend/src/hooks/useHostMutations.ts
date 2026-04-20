import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createHost,
  updateHost,
  deleteHost,
  type MutationResult,
} from "../services/hostsService";
import type { Host } from "../features/hosts/host.types";

export function useCreateHost() {
  const qc = useQueryClient();
  return useMutation<MutationResult, Error, Host>({
    mutationFn: createHost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
    },
  });
}

export function useUpdateHost(hostId: string) {
  const qc = useQueryClient();
  return useMutation<MutationResult, Error, Host>({
    mutationFn: (host) => updateHost(hostId, host),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
      qc.invalidateQueries({ queryKey: ["host", hostId] });
    },
  });
}

export function useDeleteHost() {
  const qc = useQueryClient();
  return useMutation<MutationResult, Error, string>({
    mutationFn: deleteHost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
    },
  });
}

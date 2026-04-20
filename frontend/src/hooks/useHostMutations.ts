import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHost, deleteHost } from "../services/hostsService";
import type { Host } from "../features/hosts/host.types";

export function useCreateHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Host) => createHost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
    },
  });
}

export function useDeleteHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hostId: string) => deleteHost(hostId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
    },
  });
}

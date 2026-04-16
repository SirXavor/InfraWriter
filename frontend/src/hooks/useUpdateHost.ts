import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateHost } from "../services/hostsService";
import type { Host } from "../features/hosts/host.types";

export function useUpdateHost(hostId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Host) => updateHost(hostId, data),

    onSuccess: () => {
      // refrescar este host
      queryClient.invalidateQueries({ queryKey: ["host", hostId] });

      // refrescar lista
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
    },
  });
}
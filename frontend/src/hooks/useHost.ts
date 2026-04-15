import { useQuery } from "@tanstack/react-query";
import { getHost } from "../services/hostsService";
import type { Host } from "../features/hosts/host.types";

export function useHost(hostId: string | undefined) {
  return useQuery<Host>({
    queryKey: ["host", hostId],
    queryFn: () => getHost(hostId!),
    enabled: !!hostId,
  });
}
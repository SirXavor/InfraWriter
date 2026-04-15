import { useQuery } from "@tanstack/react-query";
import { getHosts } from "../services/hostsService";
import type { Host } from "../features/hosts/host.types";

export function useHosts() {
  return useQuery<Host[]>({
    queryKey: ["hosts"],
    queryFn: getHosts,
  });
}
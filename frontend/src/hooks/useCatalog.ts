import { useQuery } from "@tanstack/react-query";
import {
  getDistros,
  getProfiles,
  getProfilesByDistro,
  getRoles,
} from "../services/catalogService";
import type { Distro, ProfileCatalogItem, RoleName } from "../types/catalog";

export function useDistros() {
  return useQuery<Distro[]>({
    queryKey: ["catalog", "distros"],
    queryFn: getDistros,
  });
}

export function useProfiles() {
  return useQuery<ProfileCatalogItem[]>({
    queryKey: ["catalog", "profiles"],
    queryFn: getProfiles,
  });
}

export function useProfilesByDistro(distro?: string) {
  return useQuery<ProfileCatalogItem[]>({
    queryKey: ["catalog", "profiles", distro],
    queryFn: () => getProfilesByDistro(distro!),
    enabled: !!distro,
  });
}

export function useRoles() {
  return useQuery<RoleName[]>({
    queryKey: ["catalog", "roles"],
    queryFn: getRoles,
  });
}
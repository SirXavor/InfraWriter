import { apiClient } from "./apiClient";
import type { Distro, ProfileCatalogItem, RoleName } from "../types/catalog";

export async function getDistros(): Promise<Distro[]> {
  const response = await apiClient.get<Distro[]>("/catalog/distros");
  return response.data;
}

export async function getProfiles(): Promise<ProfileCatalogItem[]> {
  const response = await apiClient.get<ProfileCatalogItem[]>("/catalog/profiles");
  return response.data;
}

export async function getProfilesByDistro(distro: string): Promise<ProfileCatalogItem[]> {
  const response = await apiClient.get<ProfileCatalogItem[]>(
    `/catalog/profiles?distro=${encodeURIComponent(distro)}`
  );
  return response.data;
}

export async function getRoles(): Promise<RoleName[]> {
  const response = await apiClient.get<RoleName[]>("/catalog/roles");
  return response.data;
}
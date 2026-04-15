import { apiClient } from "./apiClient";
import type { Host } from "../features/hosts/host.types";

export async function getHosts(): Promise<Host[]> {
  const response = await apiClient.get<Host[]>("/hosts");
  return response.data;
}

export async function getHost(hostId: string): Promise<Host> {
  const response = await apiClient.get<Host>(`/hosts/${hostId}`);
  return response.data;
}

export async function createHost(payload: Host): Promise<Host> {
  const response = await apiClient.post<Host>("/hosts", payload);
  return response.data;
}

export async function updateHost(hostId: string, payload: Host): Promise<Host> {
  const response = await apiClient.put<Host>(`/hosts/${hostId}`, payload);
  return response.data;
}

export async function deleteHost(hostId: string): Promise<void> {
  await apiClient.delete(`/hosts/${hostId}`);
}
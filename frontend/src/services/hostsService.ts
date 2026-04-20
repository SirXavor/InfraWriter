import { apiClient } from "./apiClient";
import type { Host } from "../features/hosts/host.types";

export interface MutationResult {
  status: string;
  host_id: string;
}

export async function getHosts(): Promise<Host[]> {
  const response = await apiClient.get<Host[]>("/hosts");
  return response.data;
}

export async function getHost(hostId: string): Promise<Host> {
  const response = await apiClient.get<Host>(`/hosts/${hostId}`);
  return response.data;
}

export async function createHost(payload: Host): Promise<MutationResult> {
  const response = await apiClient.post<MutationResult>("/hosts", payload);
  return response.data;
}

export async function updateHost(
  hostId: string,
  payload: Host
): Promise<MutationResult> {
  const response = await apiClient.put<MutationResult>(
    `/hosts/${hostId}`,
    payload
  );
  return response.data;
}

export async function deleteHost(hostId: string): Promise<MutationResult> {
  const response = await apiClient.delete<MutationResult>(`/hosts/${hostId}`);
  return response.data;
}

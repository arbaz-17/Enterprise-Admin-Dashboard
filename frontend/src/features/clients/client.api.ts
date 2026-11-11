import { apiClient } from "@/lib/api-client";
import type {
  ClientInput,
  ClientListParams,
  ClientListResponse,
  ClientResponse,
} from "./clients.types";

export const clientsApi = {
  async list(
    params: ClientListParams,
    signal?: AbortSignal,
  ): Promise<ClientListResponse> {
    const { data } = await apiClient.get<ClientListResponse>("/clients", {
      params,
      signal,
    });
    return data;
  },

  async getById(id: string, signal?: AbortSignal): Promise<ClientResponse> {
    const { data } = await apiClient.get<ClientResponse>(
      `/clients/${encodeURIComponent(id)}`,
      { signal },
    );
    return data;
  },

  async create(payload: ClientInput): Promise<ClientResponse> {
    const { data } = await apiClient.post<ClientResponse>("/clients", payload);
    return data;
  },

  async update(id: string, payload: ClientInput): Promise<ClientResponse> {
    const { data } = await apiClient.patch<ClientResponse>(
      `/clients/${encodeURIComponent(id)}`,
      payload,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/clients/${encodeURIComponent(id)}`);
  },
};

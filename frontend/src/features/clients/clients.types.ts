export type ClientStatus = "active" | "inactive";

export interface Client {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClientInput {
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  status: ClientStatus;
}

export interface ClientListParams {
  page: number;
  pageSize: number;
  q?: string;
  status?: ClientStatus;
}

export interface ClientListResponse {
  data: Client[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientResponse {
  data: Client;
}

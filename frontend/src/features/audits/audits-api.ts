
import { apiClient } from "@/lib/api-client";

import type { AuditListResponse } from "./audits.types";

export const auditsApi = {
  async list(
    signal?: AbortSignal,
  ): Promise<AuditListResponse> {
    const { data } =
      await apiClient.get<AuditListResponse>(
        "/audits",
        { signal },
      );

    return data;
  },
};

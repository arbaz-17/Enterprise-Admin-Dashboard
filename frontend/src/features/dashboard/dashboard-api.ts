import { apiClient } from "@/lib/api-client";
import type { DashboardOverviewResponse } from "./dashboard.types";

export const dashboardApi = {
  async overview(signal?: AbortSignal): Promise<DashboardOverviewResponse> {
    const { data } = await apiClient.get<DashboardOverviewResponse>(
      "/dashboard/overview",
      { signal },
    );
    return data;
  },
};

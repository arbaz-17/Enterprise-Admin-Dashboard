
import { useQuery } from "@tanstack/react-query";

import { auditsApi } from "./audits-api";

export const auditKeys = {
  all: ["audits"] as const,

  list: () => [...auditKeys.all, "list"] as const,
};

export function useAuditLogs() {
  return useQuery({
    queryKey: auditKeys.list(),

    queryFn: ({ signal }) =>
      auditsApi.list(signal),

    staleTime: 60_000,

    refetchOnWindowFocus: false,

    retry: false,
  });
}

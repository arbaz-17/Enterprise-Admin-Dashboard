
import { useQuery } from "@tanstack/react-query";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  DepartmentInput,
  UpdateDepartmentInput,
} from "./departments.types";

import type { QueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "../dashboard/dashboard.queries";
import { employeeKeys } from "../employees/employees.queries";
import { teamKeys } from "../team-assignments/team-assignment.queries";

import { departmentsApi } from "./departments-api";
import type { DepartmentListParams } from "./departments.types";

export const departmentKeys = {
  all: ["departments"] as const,

  lists: () =>
    [...departmentKeys.all, "list"] as const,

  list: (params: DepartmentListParams) =>
    [...departmentKeys.lists(), params] as const,
};

async function invalidateDepartmentQueries(
  queryClient: QueryClient,
) {
  await queryClient.invalidateQueries({
    queryKey: departmentKeys.all,
  });

  await queryClient.invalidateQueries({
    queryKey: dashboardKeys.all,
  });

  await queryClient.invalidateQueries({
    queryKey: employeeKeys.all,
  });

  await queryClient.invalidateQueries({
    queryKey: teamKeys.all,
  });
}

export function useDepartments(params: DepartmentListParams) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: ({ signal }) => departmentsApi.list(params, signal),
    staleTime: 30_000,
    retry: false,
  });
}


export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepartmentInput) =>
      departmentsApi.create(payload),

    onSuccess: () =>
      invalidateDepartmentQueries(queryClient),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateDepartmentInput) =>
      departmentsApi.update(id, payload),

    onSuccess: () =>
      invalidateDepartmentQueries(queryClient),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      departmentsApi.remove(id),

    onSuccess: () =>
      invalidateDepartmentQueries(queryClient),
  });
}

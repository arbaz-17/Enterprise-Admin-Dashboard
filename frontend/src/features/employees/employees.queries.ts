import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from './employees-api'
import type { EmployeeInput, EmployeeListParams } from './employees.types'
import type { QueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "../dashboard/dashboard.queries";
import { projectKeys } from "../projects/projects.queries";
import { teamKeys } from "../team-assignments/team-assignment.queries";

export const employeeKeys = {
  all: ['employees'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.all, 'list', params] as const,
  accounts: ['employees', 'account-options'] as const,
}

async function invalidateEmployeeQueries(
  queryClient: QueryClient,
) {
  await queryClient.invalidateQueries({
    queryKey: employeeKeys.all,
  });

  await queryClient.invalidateQueries({
    queryKey: dashboardKeys.all,
  });

  await queryClient.invalidateQueries({
    queryKey: projectKeys.all,
  });

  await queryClient.invalidateQueries({
    queryKey: teamKeys.all,
  });
}

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: ({ signal }) => employeesApi.list(params, signal),
    staleTime: 30_000,
    retry: false,
  })
}

export function useAccountOptions(enabled: boolean) {
  return useQuery({
    queryKey: employeeKeys.accounts,
    queryFn: ({ signal }) => employeesApi.accountOptions(signal),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EmployeeInput) => employeesApi.create(input),
    onSuccess: () => invalidateEmployeeQueries(queryClient),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EmployeeInput }) => employeesApi.update(id, input),
    onSuccess: () => invalidateEmployeeQueries(queryClient),
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeesApi.remove(id),
    onSuccess: () => invalidateEmployeeQueries(queryClient),
  })
}

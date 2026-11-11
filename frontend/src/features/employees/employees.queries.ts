import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from './employees-api'
import type { EmployeeInput, EmployeeListParams } from './employees.types'

export const employeeKeys = {
  all: ['employees'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.all, 'list', params] as const,
  accounts: ['employees', 'account-options'] as const,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EmployeeInput }) => employeesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  })
}

import { apiClient } from '@/lib/api-client'
import type {
  AccountOption,
  EmployeeInput,
  EmployeeListParams,
  EmployeeListResponse,
  EmployeeResponse,
} from './employees.types'

export const employeesApi = {
  async list(params: EmployeeListParams, signal?: AbortSignal): Promise<EmployeeListResponse> {
    const { data } = await apiClient.get<EmployeeListResponse>('/employees', { params, signal })
    return data
  },
  async create(payload: EmployeeInput): Promise<EmployeeResponse> {
    const { data } = await apiClient.post<EmployeeResponse>('/employees', payload)
    return data
  },
  async update(id: string, payload: EmployeeInput): Promise<EmployeeResponse> {
    const { data } = await apiClient.patch<EmployeeResponse>(`/employees/${encodeURIComponent(id)}`, payload)
    return data
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/employees/${encodeURIComponent(id)}`)
  },
  // Dedicated endpoint avoids the existing /users route's 20-record limit.
  async accountOptions(signal?: AbortSignal): Promise<AccountOption[]> {
    const { data } = await apiClient.get<{ data: AccountOption[] }>('/employees/account-options', { signal })
    return data.data
  },
}

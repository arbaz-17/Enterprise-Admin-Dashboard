export type EmployeeStatus = 'active' | 'on_leave' | 'inactive'

export interface Employee {
  id: string
  fullName: string
  workEmail: string
  designation: string
  departmentId: string
  departmentName: string
  userId: string | null
  linkedUserName: string | null
  status: EmployeeStatus
  joiningDate: string | null
  createdAt: string
  updatedAt: string
}

export interface EmployeeInput {
  fullName: string
  workEmail: string
  designation: string
  departmentId: string
  userId: string | null
  status: EmployeeStatus
  joiningDate: string | null
}

export interface EmployeeListParams {
  page: number
  pageSize: number
  q?: string
  status?: EmployeeStatus
  departmentId?: string
}

export interface EmployeeListResponse {
  data: Employee[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export interface EmployeeResponse { data: Employee }

export interface AccountOption {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  isActive: boolean
}

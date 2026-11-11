
export interface Department {
  id: string;
  name: string;
  description: string | null;
  headEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentListParams {
  page: number;
  pageSize: number;
  q?: string;
}

export interface DepartmentListResponse {
  data: Department[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DepartmentResponse {
  data: Department;
}



export interface DepartmentInput {
  name: string;
  description: string | null;
}

export interface UpdateDepartmentInput {
  id: string;
  payload: DepartmentInput;
}

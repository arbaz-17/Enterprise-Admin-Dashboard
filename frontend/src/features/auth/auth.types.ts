
export type UserRole = "admin" | "manager" | "viewer";


export type Permission =
  | "dashboard:read"
  | "users:read"
  | "users:manage"
  | "departments:read"
  | "departments:manage"
  | "employees:read"
  | "employees:manage"
  | "clients:read"
  | "clients:manage"
  | "projects:read"
  | "projects:create"
  | "projects:manage"
  | "projects:delete";


export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUser;
}

export interface CurrentUserResponse {
  user: AuthUser;
  permissions: Permission[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

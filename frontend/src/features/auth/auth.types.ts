
export type UserRole = "admin" | "manager" | "viewer";

export type Permission =
  | "dashboard:read"
  | "users:read"
  | "users:manage";

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

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router";

import { AppLayout } from "@/components/layout/app-layout";
import { LoadingState } from "@/components/shared/loading-state";
import { ProtectedRoute } from "@/features/auth/protected-route";


const LoginPage = lazy(() =>
  import("@/pages/login-page").then((module) => ({
    default: module.LoginPage,
  })),
);

const DashboardPage = lazy(() =>
  import("@/pages/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  })),
);

const SettingsPage = lazy(() =>
  import("@/pages/settings-page").then((module) => ({
    default: module.SettingsPage,
  })),
);

const DepartmentsPage = lazy(() =>
  import("@/pages/departments-page").then((module) => ({
    default: module.DepartmentsPage,
  })),
);

const EmployeesPage = lazy(() =>
  import("@/pages/employees-page").then((module) => ({
    default: module.EmployeesPage,
  })),
);

const ClientsPage = lazy(() =>
  import("@/pages/clients-page").then((module) => ({
    default: module.ClientsPage,
  })),
);

const ProjectsPage = lazy(() =>
  import("@/pages/projects-page").then((module) => ({
    default: module.ProjectsPage,
  })),
);

const ProjectTeamPage = lazy(() =>
  import("@/pages/project-team-page").then((module) => ({
    default: module.ProjectTeamPage,
  })),
);

const UsersPage = lazy(() =>
  import("@/pages/users-page").then((module) => ({
    default: module.UsersPage,
  })),
);

// --------------------------------------------------
// 2. Application routes
// --------------------------------------------------

export default function App() {
  return (
    <Routes>
      {/* Public login route */}
      <Route
        path="/login"
        element={
          <Suspense
            fallback={
              <main className="flex min-h-dvh items-center justify-center">
                <LoadingState message="Loading login..." />
              </main>
            }
          >
            <LoginPage />
          </Suspense>
        }
      />

      {/* Authentication guard */}
      <Route element={<ProtectedRoute />}>
        {/* Keep the existing dashboard layout */}
        <Route element={<AppLayout />}>
          {/*
            Shared Suspense boundary for protected pages.
            The sidebar and header remain mounted while
            an individual route's JavaScript is loading.
          */}
          <Route
            element={
              <Suspense fallback={<LoadingState message="Loading page..." />}>
                <Outlet />
              </Suspense>
            }
          >
            {/* Dashboard */}
            <Route
              element={<ProtectedRoute requiredPermission="dashboard:read" />}
            >
              <Route index element={<DashboardPage />} />
            </Route>

            {/* Departments */}
            <Route
              element={<ProtectedRoute requiredPermission="departments:read" />}
            >
              <Route path="departments" element={<DepartmentsPage />} />
            </Route>

            {/* Employees */}
            <Route
              element={<ProtectedRoute requiredPermission="employees:read" />}
            >
              <Route path="employees" element={<EmployeesPage />} />
            </Route>

            {/* Clients */}
            <Route
              element={<ProtectedRoute requiredPermission="clients:read" />}
            >
              <Route path="clients" element={<ClientsPage />} />
            </Route>

            {/* Projects & project teams */}
            <Route
              element={<ProtectedRoute requiredPermission="projects:read" />}
            >
              <Route path="projects" element={<ProjectsPage />} />
              <Route
                path="projects/:projectId/team"
                element={<ProjectTeamPage />}
              />
            </Route>

            {/* User management */}
            <Route
              element={<ProtectedRoute requiredPermission="users:manage" />}
            >
              <Route path="users" element={<UsersPage />} />
            </Route>

            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

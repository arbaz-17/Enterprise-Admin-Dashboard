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

const AuditsPage = lazy(() =>
  import("@/pages/audits-page").then((module) => ({
    default: module.AuditsPage,
  })),
);

export default function App() {
  return (
    <Routes>
     
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

     
      <Route element={<ProtectedRoute />}>
        
        <Route element={<AppLayout />}>
  
          <Route
            element={
              <Suspense fallback={<LoadingState message="Loading page..." />}>
                <Outlet />
              </Suspense>
            }
          >
            
            <Route
              element={<ProtectedRoute requiredPermission="dashboard:read" />}
            >
              <Route index element={<DashboardPage />} />
            </Route>

            
            <Route
              element={<ProtectedRoute requiredPermission="departments:read" />}
            >
              <Route path="departments" element={<DepartmentsPage />} />
            </Route>

            
            <Route
              element={<ProtectedRoute requiredPermission="employees:read" />}
            >
              <Route path="employees" element={<EmployeesPage />} />
            </Route>

            <Route
              element={<ProtectedRoute requiredPermission="clients:read" />}
            >
              <Route path="clients" element={<ClientsPage />} />
            </Route>

          
            <Route
              element={<ProtectedRoute requiredPermission="projects:read" />}
            >
              <Route path="projects" element={<ProjectsPage />} />
              <Route
                path="projects/:projectId/team"
                element={<ProjectTeamPage />}
              />
            </Route>


            <Route
              element={<ProtectedRoute requiredPermission="users:manage" />}
            >
              <Route path="users" element={<UsersPage />} />
            </Route>

            <Route
              element={<ProtectedRoute requiredPermission="audits:read" />}
            >
              <Route path="audits" element={<AuditsPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

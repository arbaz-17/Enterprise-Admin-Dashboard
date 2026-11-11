import { Routes, Route, Navigate } from "react-router";

import { AppLayout } from "@/components/layout/app-layout";

import { ProtectedRoute } from "@/features/auth/protected-route";

import { LoginPage } from "@/pages/login-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { SettingsPage } from "@/pages/settings-page";
import { DepartmentsPage } from "@/pages/departments-page";
import { EmployeesPage } from "@/pages/employees-page";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authentication required */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard permission required */}
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

          {/* Accessible to authenticated users */}
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

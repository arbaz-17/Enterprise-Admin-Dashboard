
import { Routes, Route, Navigate } from "react-router";

import { AppLayout } from "@/components/layout/app-layout";

import { LoginPage } from "@/pages/login-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { SettingsPage } from "@/pages/settings-page";

export default function App() {
  return (
    <Routes>
      {/* Public login route */}
      <Route path="login" element={<LoginPage />} />

      {/* Existing dashboard layout */}
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

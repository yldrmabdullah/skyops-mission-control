import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth';
import { AppLayout } from './components/AppLayout';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { DroneDetailPage } from './pages/DroneDetailPage';
import { DronesPage } from './pages/DronesPage';
import { MissionsPage } from './pages/MissionsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/workspace/bootstrap" element={<SignUpPage />} />
      <Route element={<RequireAuth />}>
        <Route
          path="/account/change-password"
          element={<ChangePasswordPage />}
        />
        <Route element={<AppLayout />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="drones" element={<DronesPage />} />
          <Route path="drones/:droneId" element={<DroneDetailPage />} />
          <Route path="missions" element={<MissionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

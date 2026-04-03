import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { DroneDetailPage } from './pages/DroneDetailPage';
import { DronesPage } from './pages/DronesPage';
import { MissionsPage } from './pages/MissionsPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate replace to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/drones" element={<DronesPage />} />
        <Route path="/drones/:droneId" element={<DroneDetailPage />} />
        <Route path="/missions" element={<MissionsPage />} />
      </Route>
    </Routes>
  );
}

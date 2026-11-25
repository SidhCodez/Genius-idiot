import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import AppShell from './components/AppShell';
import ToastViewport from './components/Toast';
import AuthGuard from './routes/AuthGuard';
import { BootLoader } from './components/ui';

const Landing = lazy(() => import('./screens/Landing'));
const Login = lazy(() => import('./screens/Login'));
const Setup = lazy(() => import('./screens/Setup'));
const Today = lazy(() => import('./screens/Today'));
const GoalDashboard = lazy(() => import('./screens/GoalDashboard'));
const HowItWorks = lazy(() => import('./screens/HowItWorks'));
const ResetPassword = lazy(() => import('./screens/ResetPassword'));
const Settings = lazy(() => import('./screens/Settings'));
const PublicRoadmap = lazy(() => import('./screens/PublicRoadmap'));

export default function App() {
  return (
    <Suspense fallback={<BootLoader />}>
      <Routes>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/p/:publicId" element={<PublicRoadmap />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<AuthGuard allowSetup />}>
          <Route path="/setup" element={<Setup />} />
          {/* Reachable before setup finishes, so new users can read it. */}
          <Route element={<AppShell />}>
            <Route path="/how-it-works" element={<HowItWorks />} />
          </Route>
        </Route>

        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route index element={<Today />} />
            <Route path="/goal/:goalId" element={<GoalDashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastViewport />
      <Analytics />
    </Suspense>
  );
}

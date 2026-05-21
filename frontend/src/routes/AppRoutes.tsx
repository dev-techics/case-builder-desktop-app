import { Route, Routes } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import EditorLayout from '../layouts/EditorLayout';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import BundlesPage from '@/pages/dashboard/BundlesPage';
import EditorPage from '../pages/editor/EditorPage';
import NotFound from '@/components/NotFound';
import SignInPage from '@/pages/auth/SignInPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ProtectedRoute, { PaywallRoute } from './ProtectedRoutes';
import useAuthInit from '@/features/auth/hooks/useAuthInit';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import { CoverPageEditor } from '@/features/cover-page/components/editor/CoverPageEditor';
import PaywallPage from '@/pages/auth/PaywallPage';

export default function AppRoutes() {
  useAuthInit();
  return (
    <Routes>
      {/* Auth routes - Redirect to dashboard if already logged in */}
      <Route path="/login" element={<SignInPage />} />
      <Route path="/register" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<PaywallRoute />}>
        <Route path="/paywall" element={<PaywallPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        {/* Protected routes - Editor layout */}
        <Route element={<EditorLayout />}>
          <Route element={<EditorPage />} path="/dashboard/editor/:bundleId?" />
        </Route>

        {/* Protected routes - Dashboard layout */}
        <Route element={<DashboardLayout />}>
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<BundlesPage />} path="/dashboard/bundles" />
        </Route>

        <Route element={<CoverPageEditor />} path="/cover-page-editor/:id" />
      </Route>

      {/* 404 Not Found */}
      <Route element={<NotFound />} path="*" />
    </Routes>
  );
}

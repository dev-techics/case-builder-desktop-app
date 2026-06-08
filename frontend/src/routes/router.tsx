// src/routes/router.ts
import { createHashRouter, redirect } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import EditorLayout from '@/layouts/EditorLayout';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import BundlesPage from '@/pages/dashboard/BundlesPage';
import EditorPage from '@/pages/editor/EditorPage';
import NotFound from '@/components/NotFound';
import SignInPage from '@/pages/auth/SignInPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import PaywallPage from '@/pages/auth/PaywallPage';
import { CoverPageEditor } from '@/features/cover-page/components/editor/CoverPageEditor';
import { getAuthSnapshot } from '@/features/auth/utils/authState';
import PlansPage from '@/pages/plan/PlansPage';
import PlansLayout from '@/layouts/PlansLayout';


// Guard: must be logged in + have a license
async function requireAuthAndLicense() {
  const { isAuthenticated, hasLicense, initialized } = getAuthSnapshot();
  console.log(isAuthenticated, hasLicense, initialized);
  if (!initialized) return null;
  if (!isAuthenticated) throw redirect('/login');
  if (!hasLicense) throw redirect('/plans');   

  return null;
}

// Guard: paywall page — must be logged in, but must NOT have a license
async function requireAuthNoLicense() {
  const { isAuthenticated, hasLicense, initialized } = getAuthSnapshot();

  if (!initialized) return null;
  if (!isAuthenticated) throw redirect('/login');
  if (hasLicense) throw redirect('/dashboard'); 

  return null;
}

// Guard: auth pages — redirect away if already fully set up
async function redirectIfAuthenticated() {
  const snap = getAuthSnapshot();

  if (!snap.initialized) return null;
  if (snap.isAuthenticated && snap.hasLicense) throw redirect('/dashboard');
  if (snap.isAuthenticated && !snap.hasLicense) throw redirect('/plans');

  return null;
}

export const router = createHashRouter([
  // ── Auth routes ──────────────────────────────────────────────────────────
  {
    loader: redirectIfAuthenticated,
    children: [
      { path: '/', element: <SignInPage /> },
      { path: '/login', element: <SignInPage /> },
      { path: '/register', element: <SignUpPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  //  ── Plans ──────────────────────────────────────────────────────────────
  {
    loader: requireAuthNoLicense,
    element: <PlansLayout />,
    children: [
      {
        path: '/plans',
        element: <PlansPage />
      }
    ]
  },
  //── Paywall ──────────────────────────────────────────────────────────────
  {
    loader: requireAuthNoLicense,
    children: [
      { path: '/paywall', element: <PaywallPage /> },
    ],
  },

  // ── Protected routes ─────────────────────────────────────────────────────
  {
    loader: requireAuthAndLicense,
    children: [
      {
        element: <EditorLayout />,
        children: [
          { path: '/dashboard/editor/:bundleId?', element: <EditorPage /> },
        ],
      },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/dashboard/bundles', element: <BundlesPage /> },
        ],
      },
      { path: '/cover-page-editor/:id', element: <CoverPageEditor /> },
    ],
  },

  // ── 404 ──────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
]);
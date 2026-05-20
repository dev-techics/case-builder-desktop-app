import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import {
  selectIsAuthenticated,
  selectIsInitialized,
  selectLicense,
} from '@/features/auth/redux/authSlice';
import {
  hasDesktopLicenseAccess,
  isAuthenticated as hasWebAccessToken,
} from '@/features/auth/utils';

const AuthLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const ProtectedRoute = () => {
  const isDesktop = !!window.api?.isDesktop;
  const isInitialized = useAppSelector(selectIsInitialized);
  const isUserAuthenticated = useAppSelector(selectIsAuthenticated);
  const license = useAppSelector(selectLicense);

  if (!isInitialized) {
    return <AuthLoader />;
  }

  if (isDesktop) {
    if (!isUserAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (!hasDesktopLicenseAccess(license)) {
      return <Navigate to="/paywall" replace />;
    }

    return <Outlet />;
  }

  if (!isUserAuthenticated && !hasWebAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const isDesktop = !!window.api?.isDesktop;
  const isInitialized = useAppSelector(selectIsInitialized);
  const isUserAuthenticated = useAppSelector(selectIsAuthenticated);
  const license = useAppSelector(selectLicense);

  if (!isInitialized) {
    return <AuthLoader />;
  }

  if (isDesktop) {
    if (!isUserAuthenticated) {
      return <Outlet />;
    }

    return hasDesktopLicenseAccess(license) ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <Navigate to="/paywall" replace />
    );
  }

  if (isUserAuthenticated || hasWebAccessToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const PaywallRoute = () => {
  const isDesktop = !!window.api?.isDesktop;
  const isInitialized = useAppSelector(selectIsInitialized);
  const isUserAuthenticated = useAppSelector(selectIsAuthenticated);
  const license = useAppSelector(selectLicense);

  if (!isInitialized) {
    return <AuthLoader />;
  }

  if (isDesktop) {
    if (!isUserAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (hasDesktopLicenseAccess(license)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

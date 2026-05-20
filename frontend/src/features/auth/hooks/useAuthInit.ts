import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import {
  clearAuth,
  setInitialized,
  setLicense,
  setUser,
} from '../redux/authSlice';
import { hasDesktopLicenseAccess } from '../utils';

const AUTH_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

const isProtectedPath = (pathname: string): boolean =>
  pathname.startsWith('/dashboard') ||
  pathname.startsWith('/cover-page-editor') ||
  pathname === '/paywall';

const useAuthInit = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const desktopApi = window.api?.isDesktop ? window.api : null;
  const isDesktop = !!desktopApi;

  useEffect(() => {
    if (!isDesktop) {
      dispatch(setInitialized());
      return;
    }

    let isCancelled = false;

    const init = async () => {
      try {
        const session = await desktopApi.getSession();
        if (isCancelled) {
          return;
        }

        if (!session) {
          dispatch(clearAuth());

          if (isProtectedPath(location.pathname)) {
            navigate('/login', { replace: true });
          }

          return;
        }

        const license = await desktopApi.checkLicense();
        if (isCancelled) {
          return;
        }

        dispatch(setUser(session.user));
        dispatch(setLicense(license));
        dispatch(setInitialized());

        if (hasDesktopLicenseAccess(license)) {
          if (AUTH_PATHS.has(location.pathname) || location.pathname === '/paywall') {
            navigate('/dashboard', { replace: true });
          }

          return;
        }

        if (location.pathname !== '/paywall') {
          navigate('/paywall', { replace: true });
        }
      } catch {
        if (isCancelled) {
          return;
        }

        dispatch(clearAuth());

        if (isProtectedPath(location.pathname)) {
          navigate('/login', { replace: true });
        }
      }
    };

    void init();

    return () => {
      isCancelled = true;
    };
  }, [desktopApi, dispatch, isDesktop, location.pathname, navigate]);
};

export default useAuthInit;

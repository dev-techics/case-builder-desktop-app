import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../api';
import type { AuthCredentials } from '../types/types';
import { useAppDispatch } from '@/app/hooks';
import { setLicense, setUser } from '../redux/authSlice';
import { getErrorMessage, hasDesktopLicenseAccess } from '../utils/index';

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const useLoginForm = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [desktopError, setDesktopError] = useState<string | null>(null);
  const [isDesktopLoading, setIsDesktopLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading, error, reset }] = useLoginMutation();
  const desktopApi = window.api?.isDesktop ? window.api : null;
  const isDesktop = !!desktopApi;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    setValidationError(null);
    setDesktopError(null);
    reset();

    const loginCredentials: AuthCredentials = {
      email,
      password,
    };

    if (!isValidEmail(loginCredentials.email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (loginCredentials.password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    if (isDesktop) {
      setIsDesktopLoading(true);

      try {
        const result = await desktopApi.login(loginCredentials);
        if (!result.success || !result.user) {
          setDesktopError(result.error ?? 'Unable to sign in.');
          return;
        }

        dispatch(setUser(result.user));
        dispatch(setLicense(result.license ?? null));

        navigate(
          hasDesktopLicenseAccess(result.license)
            ? '/dashboard'
            : '/paywall',
          { replace: true }
        );
      } finally {
        setIsDesktopLoading(false);
      }

      return;
    }

    try {
      const data = await login(loginCredentials).unwrap();
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      if (data.user) {
        dispatch(setUser(data.user));
      }
      if (data.license) {
        dispatch(setLicense(data.license));
      }
      navigate('/dashboard', { replace: true });
    } catch {
      // Error is handled through RTK Query state.
    }
  };

  return {
    email,
    setEmail: (value: string) => {
      setValidationError(null);
      setDesktopError(null);
      setEmail(value);
    },
    password,
    setPassword: (value: string) => {
      setValidationError(null);
      setDesktopError(null);
      setPassword(value);
    },
    showPassword,
    setShowPassword,
    handleSubmit,
    isLoading: isDesktop ? isDesktopLoading : isLoading,
    error: validationError ?? desktopError ?? getErrorMessage(error),
  };
};

export default useLoginForm;

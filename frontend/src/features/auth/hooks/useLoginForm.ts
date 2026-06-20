import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthCredentials } from '../types/types';
import { useLoginMutation } from '../api';
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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading, error, reset }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    setValidationError(null);
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

    try {
      const result = await login(loginCredentials).unwrap();
      if (!result.user) {
        setValidationError('Unable to sign in.');
        return;
      }
      dispatch(setUser(result.user));
      dispatch(setLicense(result.license ?? null));
      console.log('Login result:', result);
      hasDesktopLicenseAccess(result.license)
        ? navigate('/dashboard', { replace: true })
        : navigate('/plans', { replace: true });
      
    } catch {
      // Error is handled through RTK Query state.
    }
  };

  return {
    email,
    setEmail: (value: string) => {
      setValidationError(null);
      reset();
      setEmail(value);
    },
    password,
    setPassword: (value: string) => {
      setValidationError(null);
      reset();
      setPassword(value);
    },
    showPassword,
    setShowPassword,
    handleSubmit,
    isLoading,
    error: validationError ?? getErrorMessage(error),
  };
};

export default useLoginForm;

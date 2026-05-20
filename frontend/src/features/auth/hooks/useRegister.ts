import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../api';
import type { RegisterCredentials } from '../types/types';
import { getErrorMessage } from '../utils/index';

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const useRegister = () => {
  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [desktopError, setDesktopError] = useState<string | null>(null);
  const [isDesktopLoading, setIsDesktopLoading] = useState(false);
  const navigate = useNavigate();
  const [registerUser, { isLoading, error, reset }] = useRegisterMutation();
  const desktopApi = window.api?.isDesktop ? window.api : null;
  const isDesktop = !!desktopApi;

  const showPasswordMismatch =
    formData.password_confirmation !== '' &&
    formData.password !== formData.password_confirmation;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (validationError) {
      setValidationError(null);
    }

    if (desktopError) {
      setDesktopError(null);
    }

    reset();
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.password_confirmation
    ) {
      return;
    }

    setValidationError(null);
    setDesktopError(null);
    reset();

    if (!isValidEmail(formData.email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (isDesktop) {
      setIsDesktopLoading(true);

      try {
        const result = await desktopApi.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          passwordConfirmation: formData.password_confirmation,
        });

        if (!result.success) {
          setDesktopError(result.error ?? 'Unable to create your account.');
          return;
        }

        navigate('/login', { replace: true, state: { fromRegister: true } });
      } finally {
        setIsDesktopLoading(false);
      }

      return;
    }

    try {
      await registerUser(formData).unwrap();
      navigate('/login', { replace: true, state: { fromRegister: true } });
    } catch {
      // Error is handled through RTK Query state.
    }
  };

  return {
    formData,
    handleChange,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSubmit,
    isLoading: isDesktop ? isDesktopLoading : isLoading,
    error: validationError ?? desktopError ?? getErrorMessage(error),
    showPasswordMismatch,
  };
};

export default useRegister;

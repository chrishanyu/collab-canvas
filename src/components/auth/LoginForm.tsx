import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from './AuthLayout';
import { FormInput } from '../common/FormInput';
import { ErrorAlert } from '../common/ErrorAlert';
import { LoadingButton } from '../common/LoadingButton';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleInputChange = () => {
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors({});
    }
    if (error) {
      clearError();
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue to CollabCanvas">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            handleInputChange();
          }}
          error={validationErrors.email}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            handleInputChange();
          }}
          error={validationErrors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={loading}
        />

        {error && <ErrorAlert title="Login Failed" message={error} />}

        <LoadingButton type="submit" loading={loading} loadingText="Signing in...">
          Sign In
        </LoadingButton>

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Create one now
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginForm;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from './AuthLayout';
import { FormInput } from '../common/FormInput';
import { ErrorAlert } from '../common/ErrorAlert';
import { LoadingButton } from '../common/LoadingButton';

export const RegisterForm: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: {
      displayName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    } else if (displayName.trim().length > 50) {
      errors.displayName = 'Display name must be less than 50 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (password.length > 128) {
      errors.password = 'Password must be less than 128 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await register(email, password, displayName.trim());
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
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
    <AuthLayout
      title="Create Your Account"
      subtitle="Join CollabCanvas and start collaborating"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormInput
          id="displayName"
          label="Display Name"
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            handleInputChange();
          }}
          error={validationErrors.displayName}
          placeholder="John Doe"
          autoComplete="name"
          disabled={loading}
        />

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
          placeholder="At least 6 characters"
          autoComplete="new-password"
          disabled={loading}
        />

        <FormInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            handleInputChange();
          }}
          error={validationErrors.confirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          disabled={loading}
        />

        {error && <ErrorAlert title="Registration Failed" message={error} />}

        <LoadingButton type="submit" loading={loading} loadingText="Creating account...">
          Create Account
        </LoadingButton>

        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign in instead
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterForm;

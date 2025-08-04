import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { User } from '../types';
import { isValidEmail } from '../utils';
import { apiService } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

interface FieldState {
  value: string;
  touched: boolean;
  error: string;
  isValid: boolean;
  isFocused: boolean;
}

export default function Login({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [fieldStates, setFieldStates] = useState<{
    email: FieldState;
    password: FieldState;
  }>({
    email: { value: '', touched: false, error: '', isValid: false, isFocused: false },
    password: { value: '', touched: false, error: '', isValid: false, isFocused: false },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Real-time validation
  useEffect(() => {
    validateField('email', formData.email);
  }, [formData.email]);

  useEffect(() => {
    validateField('password', formData.password);
  }, [formData.password]);

  // Lock timer countdown
  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setTimeout(() => setLockTimer(lockTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked) {
      setIsLocked(false);
    }
  }, [lockTimer, isLocked]);

  const validateField = (fieldName: 'email' | 'password', value: string) => {
    let error = '';
    let isValid = false;

    switch (fieldName) {
      case 'email':
        if (!value) {
          error = '';
        } else if (!isValidEmail(value)) {
          error = 'Please enter a valid email address';
        } else {
          isValid = true;
        }
        break;
      case 'password':
        if (!value) {
          error = '';
        } else if (value.length < 3) {
          error = 'Password must be at least 3 characters';
        } else {
          isValid = true;
        }
        break;
    }

    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error,
        isValid,
      }
    }));
  };

  const handleFieldChange = (fieldName: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleFieldFocus = (fieldName: 'email' | 'password') => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isFocused: true,
        touched: true,
      }
    }));
  };

  const handleFieldBlur = (fieldName: 'email' | 'password') => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isFocused: false,
        touched: true,
      }
    }));
  };

  const validateForm = () => {
    const newFieldStates = { ...fieldStates };
    let hasErrors = false;

    // Validate email
    if (!formData.email) {
      newFieldStates.email.error = 'Email is required';
      newFieldStates.email.touched = true;
      hasErrors = true;
    } else if (!isValidEmail(formData.email)) {
      newFieldStates.email.error = 'Please enter a valid email address';
      hasErrors = true;
    }

    // Validate password
    if (!formData.password) {
      newFieldStates.password.error = 'Password is required';
      newFieldStates.password.touched = true;
      hasErrors = true;
    } else if (formData.password.length < 3) {
      newFieldStates.password.error = 'Password must be at least 3 characters';
      hasErrors = true;
    }

    setFieldStates(newFieldStates);
    return !hasErrors;
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }

    if (!validateForm()) {
      triggerShake();
      // Focus first field with error
      if (fieldStates.email.error) {
        emailRef.current?.focus();
      } else if (fieldStates.password.error) {
        passwordRef.current?.focus();
      }
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Call the backend login API
      const response = await apiService.login({
        email: formData.email,
        password: formData.password
      });
      
      // Store the JWT token
      localStorage.setItem('authToken', response.access_token);
      
      setSuccess(true);
      
      // Get user details
      const user = await apiService.getCurrentUser();
      
      setTimeout(() => {
        onLogin(user);
      }, 500);
      
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        setLockTimer(30); // Lock for 30 seconds
        setError('Too many failed attempts. Please wait 30 seconds before trying again.');
      } else {
        setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
      }
      
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setFormData({
      email: 'admin@admin.com',
      password: 'pass',
    });
    // Trigger validation for both fields
    setTimeout(() => {
      validateField('email', 'admin@admin.com');
      validateField('password', 'pass');
    }, 100);
  };

  const clearError = () => {
    setError('');
  };

  const getFieldClassName = (fieldName: 'email' | 'password') => {
    const field = fieldStates[fieldName];
    const baseClasses = "input-field pl-10 pr-10 transition-all duration-300";
    
    if (field.error && field.touched) {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50`;
    } else if (field.isValid && field.touched) {
      return `${baseClasses} border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50`;
    } else if (field.isFocused) {
      return `${baseClasses} border-primary-300 focus:border-primary-500 focus:ring-primary-500 bg-blue-50`;
    }
    
    return `${baseClasses} focus:border-primary-500 focus:ring-primary-500`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-md w-full space-y-8 transition-all duration-300 ${shake ? 'animate-pulse' : ''}`}>
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Welcome back
          </h2>
          <p className="text-gray-600">
            Sign in to your Stock Dashboard
          </p>
        </div>

        {/* Demo Credentials Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Demo Credentials</h3>
              <p className="text-xs opacity-90">Email: admin@admin.com</p>
              <p className="text-xs opacity-90">Password: pass</p>
            </div>
            <button
              onClick={handleQuickFill}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-xs font-medium transition-all duration-200"
            >
              Quick Fill
            </button>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${
                    fieldStates.email.error && fieldStates.email.touched 
                      ? 'text-red-500' 
                      : fieldStates.email.isValid && fieldStates.email.touched
                      ? 'text-green-500'
                      : 'text-gray-400'
                  }`} />
                </div>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onFocus={() => handleFieldFocus('email')}
                  onBlur={() => handleFieldBlur('email')}
                  className={getFieldClassName('email')}
                  placeholder="Enter your email"
                  disabled={isLocked}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {fieldStates.email.error && fieldStates.email.touched && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {fieldStates.email.isValid && fieldStates.email.touched && !fieldStates.email.error && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
              {fieldStates.email.error && fieldStates.email.touched && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  {fieldStates.email.error}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${
                    fieldStates.password.error && fieldStates.password.touched 
                      ? 'text-red-500' 
                      : fieldStates.password.isValid && fieldStates.password.touched
                      ? 'text-green-500'
                      : 'text-gray-400'
                  }`} />
                </div>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onFocus={() => handleFieldFocus('password')}
                  onBlur={() => handleFieldBlur('password')}
                  className={getFieldClassName('password')}
                  placeholder="Enter your password"
                  disabled={isLocked}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                  {fieldStates.password.error && fieldStates.password.touched && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {fieldStates.password.isValid && fieldStates.password.touched && !fieldStates.password.error && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <button
                    type="button"
                    className="hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLocked}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {fieldStates.password.error && fieldStates.password.touched && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  {fieldStates.password.error}
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  {isLocked && (
                    <p className="text-xs text-red-600 mt-1">
                      Time remaining: {lockTimer} seconds
                    </p>
                  )}
                </div>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-800">Login successful! Redirecting...</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || isLocked}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : isLocked ? (
                <span>Account Locked ({lockTimer}s)</span>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 
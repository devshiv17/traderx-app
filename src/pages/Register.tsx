import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle, Loader2, X, Shield } from 'lucide-react';
import { User as UserType } from '../types';
import { isValidEmail } from '../utils';
import { apiService } from '../services/api';

interface RegisterProps {
  onRegister: (user: UserType) => void;
}

interface FieldState {
  value: string;
  touched: boolean;
  error: string;
  isValid: boolean;
  isFocused: boolean;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

export default function Register({ onRegister }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [fieldStates, setFieldStates] = useState<{
    name: FieldState;
    email: FieldState;
    password: FieldState;
    confirmPassword: FieldState;
  }>({
    name: { value: '', touched: false, error: '', isValid: false, isFocused: false },
    email: { value: '', touched: false, error: '', isValid: false, isFocused: false },
    password: { value: '', touched: false, error: '', isValid: false, isFocused: false },
    confirmPassword: { value: '', touched: false, error: '', isValid: false, isFocused: false },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'text-gray-400',
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Real-time validation
  useEffect(() => {
    validateField('name', formData.name);
  }, [formData.name]);

  useEffect(() => {
    validateField('email', formData.email);
  }, [formData.email]);

  useEffect(() => {
    validateField('password', formData.password);
    checkPasswordStrength(formData.password);
  }, [formData.password]);

  useEffect(() => {
    validateField('confirmPassword', formData.confirmPassword);
  }, [formData.confirmPassword]);

  const checkPasswordStrength = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letter');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special character');
    }

    let color = 'text-gray-400';
    if (score >= 4) color = 'text-green-500';
    else if (score >= 3) color = 'text-yellow-500';
    else if (score >= 2) color = 'text-orange-500';
    else if (score >= 1) color = 'text-red-500';

    setPasswordStrength({ score, feedback, color });
  };

  const validateField = (fieldName: 'name' | 'email' | 'password' | 'confirmPassword', value: string) => {
    let error = '';
    let isValid = false;

    switch (fieldName) {
      case 'name':
        if (!value) {
          error = '';
        } else if (value.length < 2) {
          error = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = 'Name can only contain letters and spaces';
        } else {
          isValid = true;
        }
        break;
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
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (passwordStrength.score < 3) {
          error = 'Password is too weak';
        } else {
          isValid = true;
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = '';
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
        } else if (formData.password && value === formData.password) {
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

  const handleFieldChange = (fieldName: 'name' | 'email' | 'password' | 'confirmPassword', value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleFieldFocus = (fieldName: 'name' | 'email' | 'password' | 'confirmPassword') => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isFocused: true,
        touched: true,
      }
    }));
  };

  const handleFieldBlur = (fieldName: 'name' | 'email' | 'password' | 'confirmPassword') => {
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

    // Validate name
    if (!formData.name) {
      newFieldStates.name.error = 'Name is required';
      newFieldStates.name.touched = true;
      hasErrors = true;
    } else if (formData.name.length < 2) {
      newFieldStates.name.error = 'Name must be at least 2 characters';
      hasErrors = true;
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newFieldStates.name.error = 'Name can only contain letters and spaces';
      hasErrors = true;
    }

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
    } else if (formData.password.length < 8) {
      newFieldStates.password.error = 'Password must be at least 8 characters';
      hasErrors = true;
    } else if (passwordStrength.score < 3) {
      newFieldStates.password.error = 'Password is too weak';
      hasErrors = true;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newFieldStates.confirmPassword.error = 'Please confirm your password';
      newFieldStates.confirmPassword.touched = true;
      hasErrors = true;
    } else if (formData.confirmPassword !== formData.password) {
      newFieldStates.confirmPassword.error = 'Passwords do not match';
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

    if (!validateForm()) {
      triggerShake();
      // Focus first field with error
      if (fieldStates.name.error) {
        nameRef.current?.focus();
      } else if (fieldStates.email.error) {
        emailRef.current?.focus();
      } else if (fieldStates.password.error) {
        passwordRef.current?.focus();
      } else if (fieldStates.confirmPassword.error) {
        confirmPasswordRef.current?.focus();
      }
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Call the backend register API
      const user = await apiService.register({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        onRegister(user);
      }, 500);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setFormData({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    });
    // Trigger validation for all fields
    setTimeout(() => {
      validateField('name', 'John Doe');
      validateField('email', 'john@example.com');
      validateField('password', 'SecurePass123!');
      validateField('confirmPassword', 'SecurePass123!');
      checkPasswordStrength('SecurePass123!');
    }, 100);
  };

  const clearError = () => {
    setError('');
  };

  const getFieldClassName = (fieldName: 'name' | 'email' | 'password' | 'confirmPassword') => {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-md w-full space-y-8 transition-all duration-300 ${shake ? 'animate-pulse' : ''}`}>
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Create account
          </h2>
          <p className="text-gray-600">
            Join our Stock Dashboard community
          </p>
        </div>

        {/* Demo Credentials Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Demo Credentials</h3>
              <p className="text-xs opacity-90">Name: John Doe</p>
              <p className="text-xs opacity-90">Email: john@example.com</p>
              <p className="text-xs opacity-90">Password: SecurePass123!</p>
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
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${
                    fieldStates.name.error && fieldStates.name.touched 
                      ? 'text-red-500' 
                      : fieldStates.name.isValid && fieldStates.name.touched
                      ? 'text-green-500'
                      : 'text-gray-400'
                  }`} />
                </div>
                <input
                  ref={nameRef}
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onFocus={() => handleFieldFocus('name')}
                  onBlur={() => handleFieldBlur('name')}
                  className={getFieldClassName('name')}
                  placeholder="Enter your full name"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {fieldStates.name.error && fieldStates.name.touched && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {fieldStates.name.isValid && fieldStates.name.touched && !fieldStates.name.error && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
              {fieldStates.name.error && fieldStates.name.touched && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  {fieldStates.name.error}
                </p>
              )}
            </div>

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
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onFocus={() => handleFieldFocus('password')}
                  onBlur={() => handleFieldBlur('password')}
                  className={getFieldClassName('password')}
                  placeholder="Create a strong password"
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
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className={`h-4 w-4 ${passwordStrength.color}`} />
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      Password Strength: {passwordStrength.score}/5
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 4 ? 'bg-green-500' :
                        passwordStrength.score >= 3 ? 'bg-yellow-500' :
                        passwordStrength.score >= 2 ? 'bg-orange-500' :
                        passwordStrength.score >= 1 ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full" />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {fieldStates.password.error && fieldStates.password.touched && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  {fieldStates.password.error}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${
                    fieldStates.confirmPassword.error && fieldStates.confirmPassword.touched 
                      ? 'text-red-500' 
                      : fieldStates.confirmPassword.isValid && fieldStates.confirmPassword.touched
                      ? 'text-green-500'
                      : 'text-gray-400'
                  }`} />
                </div>
                <input
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onFocus={() => handleFieldFocus('confirmPassword')}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  className={getFieldClassName('confirmPassword')}
                  placeholder="Confirm your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                  {fieldStates.confirmPassword.error && fieldStates.confirmPassword.touched && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {fieldStates.confirmPassword.isValid && fieldStates.confirmPassword.touched && !fieldStates.confirmPassword.error && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <button
                    type="button"
                    className="hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {fieldStates.confirmPassword.error && fieldStates.confirmPassword.touched && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  {fieldStates.confirmPassword.error}
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
                <p className="text-sm text-green-800">Account created successfully! Redirecting...</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 
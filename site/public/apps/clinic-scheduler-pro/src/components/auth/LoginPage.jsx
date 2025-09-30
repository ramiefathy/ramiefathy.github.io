/**
 * LoginPage - Authentication component for sign in/sign up
 */

import React, { useState } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, Card } from '../shared';

// Utils
import { ValidationUtils } from '../../utils/validation';

const LoginPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        confirmPassword: '',
        inviteCode: ''
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const { firebaseService } = useApp();

    const validateField = (field, value) => {
        let result = { isValid: true };

        switch (field) {
            case 'email':
                result = ValidationUtils.validateEmail(value);
                break;
            case 'name':
                if (isSignUp) {
                    result = ValidationUtils.validateName(value, 'Full name');
                }
                break;
            case 'password':
                if (!value) {
                    result = { isValid: false, error: 'Password is required' };
                }
                break;
            case 'confirmPassword':
                if (isSignUp) {
                    if (!value) {
                        result = { isValid: false, error: 'Please confirm your password' };
                    } else if (value !== formData.password) {
                        result = { isValid: false, error: 'Passwords do not match' };
                    }
                }
                break;
            case 'inviteCode':
                // Invite code is optional, but if provided should be 6 characters
                if (isSignUp && value) {
                    const trimmed = value.trim().toUpperCase();
                    if (trimmed.length !== 6) {
                        result = { isValid: false, error: 'Invite code must be 6 characters' };
                    } else {
                        result = { isValid: true, value: trimmed };
                    }
                }
                break;
        }

        return result;
    };

    const handleFieldChange = (field, value) => {
        setFormData({ ...formData, [field]: value });

        // Clear error when user starts typing
        if (touched[field]) {
            const validation = validateField(field, value);
            setErrors(prev => ({
                ...prev,
                [field]: validation.isValid ? undefined : validation.error
            }));
        }
    };

    const handleFieldBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const validation = validateField(field, formData[field]);
        setErrors(prev => ({
            ...prev,
            [field]: validation.isValid ? undefined : validation.error
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validate all fields
        const fieldsToValidate = isSignUp
            ? ['email', 'password', 'name', 'confirmPassword']
            : ['email', 'password'];

        const newErrors = {};
        const validatedValues = {};
        let isFormValid = true;

        for (const field of fieldsToValidate) {
            const validation = validateField(field, formData[field]);
            if (!validation.isValid) {
                newErrors[field] = validation.error;
                isFormValid = false;
            } else if (validation.value !== undefined) {
                validatedValues[field] = validation.value;
            }
        }

        if (!isFormValid) {
            setErrors(newErrors);
            setTouched(Object.fromEntries(fieldsToValidate.map(f => [f, true])));
            setLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                const result = await firebaseService.signUp(
                    validatedValues.email || formData.email,
                    formData.password,
                    validatedValues.name || formData.name
                );
                if (result.success) {
                    toast.success('Account created successfully!');

                    // Check if user has an invite code
                    const inviteCode = validatedValues.inviteCode || formData.inviteCode;
                    if (inviteCode) {
                        // Redeem invite code to join existing institution
                        const redeemResult = await firebaseService.redeemInviteCode(inviteCode);
                        if (redeemResult.success) {
                            toast.success(`Joined ${redeemResult.institutionName} successfully!`);
                        } else {
                            toast.error(`Failed to redeem invite code: ${redeemResult.error}`);
                        }
                    } else {
                        // Create first institution if no invite code
                        const instResult = await firebaseService.createInstitution(
                            `${validatedValues.name || formData.name}'s Institution`,
                            { name: validatedValues.name || formData.name, email: validatedValues.email || formData.email }
                        );
                        if (instResult.success) {
                            toast.success('Institution created!');
                        }
                    }
                } else {
                    toast.error(result.error);
                }
            } else {
                const result = await firebaseService.signIn(
                    validatedValues.email || formData.email,
                    formData.password
                );
                if (result.success) {
                    toast.success('Welcome back!');
                } else {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const emailValidation = ValidationUtils.validateEmail(formData.email);
        if (!emailValidation.isValid) {
            setErrors({ email: emailValidation.error });
            setTouched({ email: true });
            return;
        }

        const result = await firebaseService.resetPassword(emailValidation.value);
        if (result.success) {
            toast.success('Password reset email sent!');
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card>
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-4">
                            <Icon name="calendar-days" size={32} className="text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Clinic Scheduler</h1>
                        <p className="text-gray-600 mt-2">
                            {isSignUp ? 'Create your account' : 'Sign in to continue'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    onBlur={() => handleFieldBlur('name')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                        errors.name && touched.name
                                            ? 'border-red-500 bg-red-50'
                                            : touched.name && !errors.name
                                            ? 'border-green-500'
                                            : 'border-gray-300'
                                    }`}
                                    aria-invalid={errors.name && touched.name}
                                    aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
                                />
                                {errors.name && touched.name && (
                                    <p id="name-error" className="mt-1 text-xs text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                onBlur={() => handleFieldBlur('email')}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.email && touched.email
                                        ? 'border-red-500 bg-red-50'
                                        : touched.email && !errors.email
                                        ? 'border-green-500'
                                        : 'border-gray-300'
                                }`}
                                autoComplete="email"
                                aria-invalid={errors.email && touched.email}
                                aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                            />
                            {errors.email && touched.email && (
                                <p id="email-error" className="mt-1 text-xs text-red-600">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleFieldChange('password', e.target.value)}
                                onBlur={() => handleFieldBlur('password')}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.password && touched.password
                                        ? 'border-red-500 bg-red-50'
                                        : touched.password && !errors.password
                                        ? 'border-green-500'
                                        : 'border-gray-300'
                                }`}
                                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                aria-invalid={errors.password && touched.password}
                                aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
                            />
                            {errors.password && touched.password && (
                                <p id="password-error" className="mt-1 text-xs text-red-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {isSignUp && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                                        onBlur={() => handleFieldBlur('confirmPassword')}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                            errors.confirmPassword && touched.confirmPassword
                                                ? 'border-red-500 bg-red-50'
                                                : touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword
                                                ? 'border-green-500'
                                                : 'border-gray-300'
                                        }`}
                                        autoComplete="new-password"
                                        aria-invalid={errors.confirmPassword && touched.confirmPassword}
                                        aria-describedby={errors.confirmPassword && touched.confirmPassword ? 'confirm-password-error' : undefined}
                                    />
                                    {errors.confirmPassword && touched.confirmPassword && (
                                        <p id="confirm-password-error" className="mt-1 text-xs text-red-600">
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Invite Code <span className="text-gray-400 text-xs">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.inviteCode}
                                        onChange={(e) => handleFieldChange('inviteCode', e.target.value)}
                                        onBlur={() => handleFieldBlur('inviteCode')}
                                        placeholder="Enter 6-character code"
                                        maxLength={6}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                            errors.inviteCode && touched.inviteCode
                                                ? 'border-red-500 bg-red-50'
                                                : touched.inviteCode && !errors.inviteCode && formData.inviteCode
                                                ? 'border-green-500'
                                                : 'border-gray-300'
                                        }`}
                                        style={{ textTransform: 'uppercase' }}
                                        aria-invalid={errors.inviteCode && touched.inviteCode}
                                        aria-describedby={errors.inviteCode && touched.inviteCode ? 'invite-code-error' : undefined}
                                    />
                                    {errors.inviteCode && touched.inviteCode && (
                                        <p id="invite-code-error" className="mt-1 text-xs text-red-600">
                                            {errors.inviteCode}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Have an invite code? Enter it to join an existing institution.
                                    </p>
                                </div>
                            </>
                        )}

                        <Button type="submit" className="w-full" loading={loading}>
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </Button>

                        {!isSignUp && (
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                className="w-full text-sm text-primary-600 hover:text-primary-700"
                            >
                                Forgot Password?
                            </button>
                        )}

                        <div className="text-center pt-4 border-t">
                            <p className="text-sm text-gray-600">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </button>
                            </p>
                        </div>
                    </form>
                </Card>

                <p className="text-center text-xs text-gray-500 mt-4">
                    Protected by Firebase Authentication • Real-time Sync Enabled
                </p>
            </div>
        </div>
    );
};

export default LoginPage;

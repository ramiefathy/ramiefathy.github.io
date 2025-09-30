/**
 * Validation utilities for clinic scheduler
 * Form validation helpers with RFC-compliant patterns
 */

export const ValidationUtils = {
    // Email validation using RFC 5322 compliant regex
    validateEmail: (email) => {
        if (!email) return { isValid: false, error: 'Email is required' };
        const trimmedEmail = email.trim();
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(trimmedEmail)) {
            return { isValid: false, error: 'Please enter a valid email address' };
        }
        if (trimmedEmail.length > 255) {
            return { isValid: false, error: 'Email must be less than 255 characters' };
        }
        return { isValid: true, value: trimmedEmail };
    },

    // Required field validation
    validateRequired: (value, fieldName) => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return { isValid: false, error: `${fieldName} is required` };
        }
        return { isValid: true, value: typeof value === 'string' ? value.trim() : value };
    },

    // Trim and validate length
    trimAndValidate: (value, maxLength, fieldName) => {
        if (!value) return { isValid: true, value: '' };
        const trimmed = value.trim();
        if (trimmed.length > maxLength) {
            return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
        }
        return { isValid: true, value: trimmed };
    },

    // Phone number validation (optional)
    validatePhoneNumber: (phone, required = false) => {
        if (!phone && !required) return { isValid: true, value: '' };
        if (!phone && required) return { isValid: false, error: 'Phone number is required' };

        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10) {
            return { isValid: false, error: 'Phone number must be at least 10 digits' };
        }
        if (cleaned.length > 15) {
            return { isValid: false, error: 'Phone number must be less than 15 digits' };
        }

        // Format as (XXX) XXX-XXXX for US numbers
        let formatted = cleaned;
        if (cleaned.length === 10) {
            formatted = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
        }
        return { isValid: true, value: formatted };
    },

    // Name validation - no numbers or special characters except spaces, hyphens, apostrophes
    validateName: (name, fieldName = 'Name') => {
        if (!name) return { isValid: false, error: `${fieldName} is required` };
        const trimmed = name.trim();
        if (trimmed.length < 2) {
            return { isValid: false, error: `${fieldName} must be at least 2 characters` };
        }
        if (trimmed.length > 100) {
            return { isValid: false, error: `${fieldName} must be less than 100 characters` };
        }
        const nameRegex = /^[a-zA-Z\s'-]+$/;
        if (!nameRegex.test(trimmed)) {
            return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
        }
        return { isValid: true, value: trimmed };
    },

    // PGY level validation
    validatePGYLevel: (level) => {
        const num = parseInt(level);
        if (isNaN(num) || num < 1 || num > 10) {
            return { isValid: false, error: 'PGY level must be between 1 and 10' };
        }
        return { isValid: true, value: num };
    },

    // Validate all fields in a form
    validateForm: (fields) => {
        const errors = {};
        const values = {};
        let isValid = true;

        for (const [key, validation] of Object.entries(fields)) {
            const result = validation();
            if (!result.isValid) {
                errors[key] = result.error;
                isValid = false;
            } else {
                values[key] = result.value;
            }
        }

        return { isValid, errors, values };
    }
};

export default ValidationUtils;

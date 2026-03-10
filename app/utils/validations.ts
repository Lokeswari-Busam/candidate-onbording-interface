// Validation utilities for onboarding forms

export const validations = {
  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone number validation (10 digits)
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  },

  // Date validation
  isValidDate: (date: string): boolean => {
    if (!date) return false;
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  },

  // Date of birth validation (not in future)
  isValidDOB: (date: string): boolean => {
    if (!validations.isValidDate(date)) return false;
    const dateObj = new Date(date);
    return dateObj <= new Date();
  },

  // Age validation (at least 18 years old)
  isValidAge: (date: string, minAge: number = 18): boolean => {
    if (!validations.isValidDate(date)) return false;
    const dateObj = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
      age--;
    }
    return age >= minAge;
  },

  // File type validation
  isValidFileType: (fileName: string, allowedTypes: string[]): boolean => {
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
    return allowedTypes.includes(fileExt);
  },

  // File size validation (in MB)
  isValidFileSize: (sizeInBytes: number, maxSizeMB: number = 5): boolean => {
    return sizeInBytes <= maxSizeMB * 1024 * 1024;
  },

  // Name validation (letters and spaces only)
  isValidName: (name: string): boolean => {
    return /^[A-Za-z\s\-'.]+$/.test(name);
  },

  // Alphanumeric validation
  isAlphanumeric: (str: string): boolean => {
    return /^[a-zA-Z0-9\s\-'.]*$/.test(str);
  },

  // URL validation
  isValidURL: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Postal code validation (Indian - 6 digits)
  isValidPostalCode: (code: string): boolean => {
    return /^\d{6}$/.test(code.replace(/\D/g, ""));
  },

  // Alias for isValidPostalCode
  isValidPincode: (code: string): boolean => {
    return validations.isValidPostalCode(code);
  },

  // Required field validation
  isRequired: (value: string | number | undefined): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  },


  // Empty check (useful for dropdowns)
  isEmpty: (value: string | undefined): boolean => {
    return !validations.isRequired(value);
  },

  // Min length validation
  minLength: (str: string, length: number): boolean => {
    return str.trim().length >= length;
  },


  // Max length validation
  maxLength: (str: string, length: number): boolean => {
    return str.trim().length <= length;
  },
};

// Error message templates
export const errorMessages = {
  REQUIRED: "This field is required",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_PHONE: "Phone number must be 10 digits",
  INVALID_DOB: "Date of birth must be in the past",
  INVALID_AGE: (minAge: number) => `You must be at least ${minAge} years old`,
  INVALID_DATE: "Please enter a valid date",
  INVALID_FILE_TYPE: (types: string[]) => `File must be one of: ${types.join(", ")}`,
  INVALID_FILE_SIZE: (maxMB: number) => `File size must not exceed ${maxMB}MB`,

  INVALID_URL: "Please enter a valid URL",
  INVALID_POSTAL_CODE: "Postal code must be 6 digits",
  MIN_LENGTH: (length: number) => `Minimum ${length} characters required`,
  MAX_LENGTH: (length: number) => `Maximum ${length} characters allowed`,
  ALPHANUMERIC: "Only letters, numbers, spaces, hyphens and apostrophes allowed",
};

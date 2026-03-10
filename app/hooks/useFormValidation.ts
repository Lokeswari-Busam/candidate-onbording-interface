import { useState, useCallback } from "react";

interface FormValidationState {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
}

interface ValidationRules {
  [fieldName: string]: Array<{
    validate: (value: unknown) => boolean;
    errorMessage: string;
  }>;
}

export function useFormValidation(
  initialRules?: ValidationRules
) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (fieldName: string, value: unknown, rules?: ValidationRules[string]): string => {
      if (!rules || rules.length === 0) return "";

      for (const rule of rules) {
        if (!rule.validate(value)) {
          return rule.errorMessage;
        }
      }
      return "";
    },
    []
  );

  const validateAllFields = useCallback(
    (formData: Record<string, unknown>, rules: ValidationRules): boolean => {
      const newErrors: Record<string, string> = {};

      Object.entries(rules).forEach(([fieldName, fieldRules]) => {
        const error = validateField(fieldName, formData[fieldName], fieldRules);
        if (error) {
          newErrors[fieldName] = error;
        }
      });

      setFieldErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [validateField]
  );

  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown, rules?: ValidationRules[string]) => {
      // Clear error when user starts typing
      if (touched[fieldName]) {
        const error = validateField(fieldName, value, rules);
        setFieldErrors((prev) => ({
          ...prev,
          [fieldName]: error,
        }));
      }
    },
    [touched, validateField]
  );

  const handleFieldBlur = useCallback(
    (fieldName: string, value: unknown, rules?: ValidationRules[string]) => {
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));

      const error = validateField(fieldName, value, rules);
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    },
    [validateField]
  );

  const clearErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const setError = useCallback((fieldName: string, error: string) => {
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  }, []);

  return {
    fieldErrors,
    touched,
    validateField,
    validateAllFields,
    handleFieldChange,
    handleFieldBlur,
    clearErrors,
    setError,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

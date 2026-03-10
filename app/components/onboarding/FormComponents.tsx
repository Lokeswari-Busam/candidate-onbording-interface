import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  helperText?: string;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error,
  children,
  helperText,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block mb-2 text-sm font-semibold text-indigo-900 dark:text-gray-200">
        {label}
        {required && <span className="ml-1 text-rose-600 dark:text-rose-500 font-bold">*</span>}
      </label>
      <div className="relative">
        {children}
      </div>
      {error && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export function TextInput({
  error,
  label,
  required,
  ...props
}: TextInputProps) {
  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        <input
          {...props}
          className={`w-full px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
            error
              ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20 focus:ring-rose-500 focus:ring-offset-rose-100 dark:focus:ring-offset-gray-900"
              : "border-indigo-300 dark:border-indigo-500/30 bg-white/90 dark:bg-white/10 hover:border-indigo-400 dark:hover:border-indigo-400/50 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          }`}
        />
      </FormField>
    );
  }

  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
        error
          ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20 focus:ring-rose-500 dark:focus:ring-offset-gray-900"
          : "border-indigo-300 dark:border-indigo-500/30 bg-white/90 dark:bg-white/10 hover:border-indigo-400 dark:hover:border-indigo-400/50 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
      }`}
    />
  );
}

interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectInput({
  error,
  label,
  required,
  options,
  placeholder,
  ...props
}: SelectInputProps) {
  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        <select
          {...props}
          className={`w-full px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none cursor-pointer text-gray-900 dark:text-white option:bg-indigo-600 option:text-white ${
            error
              ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20 focus:ring-rose-500 focus:ring-offset-rose-100 dark:focus:ring-offset-gray-900"
              : "border-indigo-300 dark:border-indigo-500/30 bg-white/90 dark:bg-white/10 hover:border-indigo-400 dark:hover:border-indigo-400/50 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%234F46E5' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,

            backgroundPosition: 'right 1rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem',
          }}
        >
          <option value="">{placeholder || "Select an option"}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {props.children}
        </select>
      </FormField>
    );
  }

  return (
    <select
      {...props}
      className={`w-full px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none cursor-pointer text-gray-900 dark:text-white option:bg-indigo-600 option:text-white ${
        error
          ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20 focus:ring-rose-500 dark:focus:ring-offset-gray-900"
          : "border-indigo-300 dark:border-indigo-500/30 bg-white/90 dark:bg-white/10 hover:border-indigo-400 dark:hover:border-indigo-400/50 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%234F46E5' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 1rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem',
      }}
    >
      <option value="">{placeholder || "Select an option"}</option>
      {props.children}
    </select>
  );
}

interface CheckboxInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function CheckboxInput({ label, error, ...props }: CheckboxInputProps) {
  return (
    <div className="mb-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...props}
          className={`w-5 h-5 rounded-lg border-2 transition-all duration-200 cursor-pointer accent-indigo-600 ${
            error
              ? "border-rose-400"
              : "border-indigo-300 hover:border-indigo-400"
          }`}
        />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{label}</span>
      </label>
      {error && <p className="mt-1 ml-8 text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
}

interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
  fileName?: string;
}

export function FileInput({
  error,
  label,
  required,
  fileName,
  ...props
}: FileInputProps) {
  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        <div className="flex gap-3 items-center">
          <label className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl">
            📁 Choose File
            <input
              type="file"
              {...props}
              className="hidden"
            />
          </label>
          {fileName && (
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
              {fileName}
            </span>
          )}
        </div>
      </FormField>
    );
  }

  return (
    <div className="flex gap-3 items-center">
      <label className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl">
        📁 Choose File
        <input
          type="file"
          {...props}
          className="hidden"
        />
      </label>
      {fileName && (
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
          {fileName}
        </span>
      )}
    </div>
  );
}

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg hover:shadow-xl";

  const variantStyles = {
    primary: "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 focus:ring-indigo-500",
    secondary: "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 focus:ring-gray-500 dark:from-gray-700 dark:to-gray-800 dark:text-gray-100 dark:hover:from-gray-600 dark:hover:to-gray-700",
    danger: "bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-700 hover:to-rose-800 focus:ring-rose-500",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 focus:ring-emerald-500",
  }[variant];

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }[size];

  const disabledStyles = "disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${disabledStyles}`}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function LinkButton({ href, children, className = "" }: LinkButtonProps) {
  return (
    <a
      href={href}
      className={`text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm transition-colors duration-200 ${className}`}
    >
      {children}
    </a>
  );
}

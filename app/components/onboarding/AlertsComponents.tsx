import React from "react";

interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ type, message, onClose, className = "" }: AlertProps) {
  const bgColor = {
    success: "bg-emerald-500/10 dark:bg-emerald-500/20",
    error: "bg-rose-500/10 dark:bg-rose-500/20",
    warning: "bg-amber-500/10 dark:bg-amber-500/20",
    info: "bg-indigo-500/10 dark:bg-indigo-500/20",
  }[type];

  const borderColor = {
    success: "border-emerald-300 dark:border-emerald-400/50",
    error: "border-rose-300 dark:border-rose-400/50",
    warning: "border-amber-300 dark:border-amber-400/50",
    info: "border-indigo-300 dark:border-indigo-400/50",
  }[type];

  const textColor = {
    success: "text-emerald-700 dark:text-emerald-200",
    error: "text-rose-700 dark:text-rose-200",
    warning: "text-amber-700 dark:text-amber-200",
    info: "text-indigo-700 dark:text-indigo-200",
  }[type];

  const iconColor = {
    success: "text-emerald-600 dark:text-emerald-300",
    error: "text-rose-600 dark:text-rose-300",
    warning: "text-amber-600 dark:text-amber-300",
    info: "text-indigo-600 dark:text-indigo-300",
  }[type];

  const icon = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }[type];

  return (
    <div
      className={`p-4 rounded-xl border-2 ${bgColor} ${borderColor} flex items-start gap-3 backdrop-blur-sm shadow-md ${className}`}
    >
      <span className={`font-bold text-lg ${iconColor} mt-0.5`}>{icon}</span>
      <p className={`text-sm ${textColor} flex-1 font-medium`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`text-lg hover:opacity-70 transition-opacity duration-200 ${textColor} flex-shrink-0`}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function SuccessAlert({ message, onClose }: { message: string; onClose?: () => void }) {
  return <Alert type="success" message={message} onClose={onClose} />;
}

export function ErrorAlert({ message, onClose }: { message: string; onClose?: () => void }) {
  return <Alert type="error" message={message} onClose={onClose} />;
}

export function WarningAlert({ message, onClose }: { message: string; onClose?: () => void }) {
  return <Alert type="warning" message={message} onClose={onClose} />;
}

export function InfoAlert({ message, onClose }: { message: string; onClose?: () => void }) {
  return <Alert type="info" message={message} onClose={onClose} />;
}

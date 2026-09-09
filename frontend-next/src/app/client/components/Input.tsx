"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helper, leftIcon, rightIcon, inputSize = "md", id, ...props }, ref) => {
    const sizeClass = inputSize === "sm" ? "cp-input-sm" : inputSize === "lg" ? "cp-input-lg" : "";
    const stateClass = error ? "cp-input-error" : "";

    const inputClasses = [
      "cp-input",
      sizeClass,
      stateClass,
      leftIcon ? "cp-input-with-left-icon" : "",
      rightIcon ? "cp-input-with-right-icon" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="cp-label">
            {label}
          </label>
        )}
        <div className="cp-input-wrapper">
          {leftIcon && <span className="cp-input-icon-left">{leftIcon}</span>}
          <input ref={ref} id={id} className={inputClasses} {...props} />
          {rightIcon && <span className="cp-input-icon-right">{rightIcon}</span>}
        </div>
        {error && <p className="cp-error">{error}</p>}
        {helper && !error && <p className="cp-helper">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, helper, options, id, ...props }, ref) => {
    const stateClass = error ? "cp-input-error" : "";

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="cp-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`cp-input cp-select ${stateClass} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="cp-error">{error}</p>}
        {helper && !error && <p className="cp-helper">{helper}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, helper, id, ...props }, ref) => {
    const stateClass = error ? "cp-input-error" : "";

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="cp-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={`cp-input cp-textarea ${stateClass} ${className}`}
          {...props}
        />
        {error && <p className="cp-error">{error}</p>}
        {helper && !error && <p className="cp-helper">{helper}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

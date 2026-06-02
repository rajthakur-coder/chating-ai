"use client";

import React, { forwardRef, useEffect, useState } from "react";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";

interface CustomInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  type?: "text" | "password" | "email" | "number" | "tel";
  onChange: (value: string) => void;
  onClear?: () => void;
  countryCode?: string;
  error?: boolean;
  helperText?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  optional?: boolean;
  min?: string;
  maxLength?: number;
  onBlur?: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  height?: string;
  autoComplete?: string;
}

const CustomInput = forwardRef<HTMLDivElement, CustomInputProps>(
  (
    {
      label,
      placeholder,
      value = "",
      type = "text",
      onChange,
      onClear,
      countryCode,
      error,
      helperText,
      className = "",
      multiline = false,
      rows = 1,
      disabled = false,
      optional = false,
      min,
      maxLength,
      onBlur,
      height = "45px",
      autoComplete,
    },
    ref,
  ) => {
    const [localValue, setLocalValue] = useState(value);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
      if (value !== localValue) setLocalValue(value);
    }, [value, localValue]);

    const handleTextChange = (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const nextValue = event.target.value;
      setLocalValue(nextValue);
      onChange(nextValue);
    };

    const inputType = type === "password" && showPassword ? "text" : type;

    const inputBaseClasses = `
      w-full outline-none transition-all duration-300 ease-in-out
      border rounded-[5px] text-[#0d0c22] placeholder:text-[#94a3b8]
      appearance-none
      ${multiline ? "py-2" : "leading-[30px]"}
      ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white"}
      ${
        error
          ? "border-red-500 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/20"
          : "border-gray-300 hover:border-[#818cf8] focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30"
      }
      ${countryCode ? "pl-[3.5rem]" : "pl-3"}
      ${type === "password" ? "pr-[3rem]" : onClear && localValue ? "pr-[2.5rem]" : "pr-3"}
    `;

    return (
      <div className={`flex w-full flex-col gap-1 ${className}`} ref={ref}>
        {label && (
          <label className="mb-0.5 flex items-center gap-1 text-sm font-medium text-gray-800">
            <span>{label}</span>
            {optional && <span className="ml-1 font-normal text-gray-400">Optional</span>}
          </label>
        )}

        <div className="relative flex w-full items-center">
          {countryCode && (
            <span className="pointer-events-none absolute left-3 z-10 text-sm font-medium text-gray-500">
              {countryCode}
            </span>
          )}

          {multiline ? (
            <textarea
              value={localValue}
              onChange={handleTextChange}
              placeholder={placeholder}
              onBlur={onBlur}
              rows={rows}
              style={{ height: multiline ? "auto" : height }}
              className={`${inputBaseClasses} min-h-[80px] resize-y`}
              autoComplete={autoComplete}
              disabled={disabled}
            />
          ) : (
            <input
              type={inputType}
              value={localValue}
              onChange={handleTextChange}
              placeholder={placeholder}
              disabled={disabled}
              min={min}
              maxLength={maxLength}
              style={{ height }}
              className={inputBaseClasses}
              onBlur={onBlur}
              autoComplete={autoComplete}
            />
          )}

          <div className={`absolute right-3 flex items-center gap-2 ${multiline ? "top-3" : ""}`}>
            {onClear && localValue && !disabled && type !== "password" && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setLocalValue("");
                  onClear();
                }}
                className="z-20 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
              >
                <FiX size={18} />
              </button>
            )}

            {type === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={disabled}
                className="z-20 text-[#64748b] transition-colors hover:text-[#818cf8]"
              >
                {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              </button>
            )}
          </div>
        </div>

        {helperText && (
          <p className={`mt-0.5 text-[12px] font-medium ${error ? "text-red-500" : "text-gray-500"}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

CustomInput.displayName = "CustomInput";

export default CustomInput;

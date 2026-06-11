"use client";

import Icon from "@/components/ui/Icon";
import React, { ReactNode, useEffect, useRef, useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface ButtonDropdownProps {
  label?: string;
  buttonLabel?: string;
  buttonContent?: ReactNode;
  options: Option[];
  value?: string;
  defaultLabel?: string;
  onChange?: (value: string | undefined, label: string | undefined) => void;
  disabled?: boolean;
  optional?: boolean;
  error?: boolean;
  helperText?: string;
  className?: string;
  minWidth?: string;
  maxWidth?: string;
  isClearable?: boolean;
}

const ButtonDropdown: React.FC<ButtonDropdownProps> = ({
  label,
  buttonLabel = "Select Option",
  buttonContent,
  options,
  value,
  defaultLabel,
  onChange,
  disabled = false,
  optional = false,
  error = false,
  helperText,
  className = "",
  minWidth = "200px",
  maxWidth = "400px",
  isClearable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | undefined>(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === selected);

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelected(undefined);
    onChange?.(undefined, undefined);
  };

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-1 ${className}`}
      style={{ minWidth, maxWidth, width: "100%" }}
    >
      {label && (
        <label className="mb-0.5 flex items-center gap-1 text-sm font-medium text-foreground">
          <span>{label}</span>
          {optional && <span className="ml-1 font-normal text-muted">Optional</span>}
        </label>
      )}

      <div className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={`flex h-[45px] w-full items-center justify-between gap-2 rounded-[5px] border px-3 text-sm outline-none transition-all duration-300 ease-in-out ${
            disabled ? "cursor-not-allowed bg-surface-strong opacity-60" : "cursor-pointer bg-white dark:bg-slate-950"
          } ${
            error
              ? "border-red-500 ring-[3px] ring-red-500/20"
              : open
                ? "border-[#818cf8] ring-[3px] ring-[#818cf8]/30"
                : "border-default hover:border-[#818cf8]"
          }`}
        >
          <span className="min-w-0 flex-1 truncate text-left text-foreground">
            {buttonContent || selectedOption?.label || defaultLabel || buttonLabel}
          </span>

          <div className="flex items-center gap-1">
            {isClearable && selected && !disabled && (
              <span
                onClick={handleClear}
                className="rounded-full p-0.5 text-muted transition-colors hover:bg-surface-strong hover:text-red-500"
              >
                <Icon name="fi:x" size={18} />
              </span>
            )}
            <Icon name="fi:chevron-down"
              size={20}
              className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {open && !disabled && (
          <div className="absolute left-0 right-0 z-[100] mt-1.5 overflow-hidden rounded-lg border border-default bg-white shadow-xl dark:bg-slate-950">
            <div className="max-h-[250px] overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelected(option.value);
                    onChange?.(option.value, option.label);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    option.value === selected
                      ? "bg-[#818cf8]/10 font-semibold text-[#818cf8]"
                      : "text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {helperText && (
        <p className={`mt-0.5 text-[12px] font-medium ${error ? "text-red-500" : "text-muted"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default ButtonDropdown;

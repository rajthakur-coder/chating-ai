import Icon from "@/components/ui/Icon";
import React, { useEffect, useRef, useState } from "react";

export type SelectOption = {
  label: string;
  value: string;
};

interface CustomSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string, option?: SelectOption) => void;
  placeholder?: string;
  disabled?: boolean;
  optional?: boolean;
  error?: boolean;
  helperText?: string;
  className?: string;
  isClearable?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select option",
  disabled = false,
  optional = false,
  error = false,
  helperText,
  className = "",
  isClearable = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative flex w-full flex-col gap-1 ${className}`}>
      {label ? (
        <label className="mb-0.5 flex items-center gap-1 text-sm font-medium text-foreground">
          <span>{label}</span>
          {optional ? <span className="ml-1 font-normal text-muted">Optional</span> : null}
        </label>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-[45px] w-full items-center justify-between gap-2 rounded-[5px] border bg-white px-3 text-left text-sm outline-none transition-all dark:bg-slate-950 ${
          disabled
            ? "cursor-not-allowed bg-surface-strong opacity-60"
            : "cursor-pointer"
        } ${
          error
            ? "border-red-500 ring-[3px] ring-red-500/20"
            : open
              ? "border-[#818cf8] ring-[3px] ring-[#818cf8]/30"
              : "border-default hover:border-[#818cf8]"
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${selectedOption ? "text-foreground" : "text-muted"}`}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {isClearable && value && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
              className="rounded-full p-0.5 text-muted transition-colors hover:bg-surface-strong hover:text-red-500"
            >
              <Icon name="fi:x" size={18} />
            </span>
          ) : null}
          <Icon name="fi:chevron-down"
            size={18}
            className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1.5 overflow-hidden rounded-lg border border-default bg-white shadow-xl dark:bg-slate-950">
          <div className="max-h-[250px] overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value, option);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  option.value === value
                    ? "bg-[#818cf8]/10 font-semibold text-[#818cf8]"
                    : "text-foreground hover:bg-surface-hover"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {helperText ? (
        <p className={`mt-0.5 text-[12px] font-medium ${error ? "text-red-500" : "text-muted"}`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default CustomSelect;

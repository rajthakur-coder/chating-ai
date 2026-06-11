import Icon from "@/components/ui/Icon";
import React from "react";
import clsx from "clsx";

interface SearchInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  width?: string;
  height?: string;
  className?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  wrapperClassName?: string;
  rounded?: string;
  autoFocus?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  width = "320px",
  height = "45px",
  onBlur,
  onKeyDown,
  className,
  wrapperClassName,
  rounded,
  autoFocus = false,
}) => {
  return (
    <div
      className={clsx("relative w-full flex flex-col gap-1", wrapperClassName)}
      style={{ maxWidth: width }}
    >
      <div className="relative flex items-center w-full" style={{ height }}>
        <div className="absolute left-4 flex items-center justify-center pointer-events-none z-10">
          <Icon name="fi:search" className="text-[#64748b] text-[16px] md:text-[18px]" />
        </div>
        <input
          type="text"
          autoFocus={autoFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(
            "w-full h-full outline-none transition-all duration-300 ease-in-out border text-[#0d0c22] placeholder:text-[#94a3b8]",
            "text-sm md:text-base",
            "pl-[3rem] pr-3 bg-background",
            "border-gray-300 hover:border-[#818cf8] focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30",
            rounded ? rounded : "rounded-[30px]",
            className,
          )}
        />
      </div>
    </div>
  );
};

export default SearchInput;

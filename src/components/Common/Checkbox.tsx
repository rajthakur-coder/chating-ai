import React from "react";
import clsx from "clsx";
import { FiCheck } from "react-icons/fi";

type CheckboxSize = "xs" | "sm" | "md" | "lg";
type CheckboxShape = "square" | "rounded" | "roundedmd" | "circle";
type LabelPosition = "left" | "right";

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  size?: CheckboxSize;
  shape?: CheckboxShape;
  showLabel?: boolean;
  label?: string;
  labelPosition?: LabelPosition;
  checkedIcon?: React.ReactNode;
  checkedColor?: string;
  uncheckedColor?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  size = "md",
  shape = "rounded",
  showLabel = false,
  label = "",
  labelPosition = "right",
  checkedIcon,
  checkedColor = "#1CBF4A",
  uncheckedColor = "#FFFFFF",
}) => {
  const borderClr = "#D1D5DB";
  const labelColor = "#111827";
  const iconColor = "text-white";
  const sizes: Record<CheckboxSize, string> = {
    xs: "w-4 h-4 text-[10px]",
    sm: "w-5 h-5 text-[12px]",
    md: "w-7 h-7 text-[14px]",
    lg: "w-10 h-10 text-[18px]",
  };

  // SHAPES
  const shapes: Record<CheckboxShape, string> = {
    square: "rounded-none",
    rounded: "rounded",
    roundedmd: "rounded-md",
    circle: "rounded-full",
  };

  const renderIcon = () => {
    if (checkedIcon) return checkedIcon;
    return <FiCheck className={clsx("w-3 h-3", iconColor)} strokeWidth={3} />;
  };

  const isTailwindBg = (color: string) => color.startsWith("bg-");

  return (
    <label
      onClick={onChange}
      className={clsx(
        "flex items-center cursor-pointer select-none",
        labelPosition === "left" ? "space-x-reverse space-x-2" : "space-x-2",
      )}
    >
      {/* Label LEFT */}
      {labelPosition === "left" && showLabel && (
        <span style={{ color: labelColor }} className="text-sm">
          {label}
        </span>
      )}

      {/* Checkbox box */}
      <div
        className={clsx(
          "flex items-center justify-center transition-all shadow-sm",
          sizes[size],
          shapes[shape],
          checked
            ? isTailwindBg(checkedColor)
              ? checkedColor
              : ""
            : isTailwindBg(uncheckedColor)
              ? uncheckedColor
              : "border",
        )}
        style={{
          backgroundColor: checked
            ? !isTailwindBg(checkedColor)
              ? checkedColor
              : undefined
            : !isTailwindBg(uncheckedColor)
              ? uncheckedColor
              : undefined,
          borderColor: borderClr,
          transitionDuration: "250ms",
        }}
      >
        {checked && renderIcon()}
      </div>
      {labelPosition === "right" && showLabel && (
        <span style={{ color: labelColor }} className="text-sm">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;

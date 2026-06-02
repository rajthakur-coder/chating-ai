import React from "react";
import clsx from "clsx";
type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonColor =
  | "primary"
  | "secondary"
  | "danger"
  | "accent"
  | "surface"
  | "light"
  | "red"
  | "blue";
type ButtonSize = "xs" | "sm" | "md" | "lg";
type ButtonShape = "square" | "rounded" | "circle";
type LoaderType = "default" | "bounce";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: React.ElementType<{ className?: string }>;
  iconPosition?: "left" | "right";
  color?: ButtonColor;
  size?: ButtonSize;
  shape?: ButtonShape;
  variant?: ButtonVariant;
  loading?: boolean;
  loaderType?: LoaderType;
  animationSpeed?: number;
  width?: string | number;
  height?: string | number;
  fullWidthOnMobile?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  text = "Button",
  type = "button",
  icon: Icon,
  iconPosition = "left",
  color = "primary",
  size = "md",
  shape = "rounded",
  variant = "solid",
  loading = false,
  loaderType = "default",
  disabled = false,
  animationSpeed = 200,
  width,
  height,
  fullWidthOnMobile = false,
  className,
  ...props
}) => {
  const sizes: Record<ButtonSize, string> = {
    xs: "text-xs px-2 py-1",
    sm: "text-sm px-3 py-1.5",
    md: "text-sm sm:text-base px-3 sm:px-4 py-2",
    lg: "text-base sm:text-lg px-4 sm:px-6 py-2.5 sm:py-3",
  };
  const shapes: Record<ButtonShape, string> = {
    square: "rounded-none",
    rounded: "rounded-md",
    circle: "rounded-full",
  };
  const baseColors: Record<ButtonColor, Record<ButtonVariant, string>> = {
    primary: {
      solid: "bg-primary text-background hover:bg-primary/90",
      outline: "border border-border-input text-primary hover:bg-primary/10",
      ghost: "text-primary hover:bg-primary/10",
    },
    secondary: {
      solid: "bg-secondary text-background hover:bg-secondary/90",
      outline:
        "border border-border-input text-secondary hover:bg-secondary/10",
      ghost: "text-secondary hover:bg-secondary/10",
    },
    accent: {
      solid: "bg-accent text-background hover:bg-accent/90",
      outline: "border border-border-input text-accent hover:bg-accent/10",
      ghost: "text-accent hover:bg-accent/10",
    },
    danger: {
      solid: "bg-danger text-background hover:bg-danger/90",
      outline: "border border-border-input text-danger hover:bg-danger/10",
      ghost: "text-danger hover:bg-danger/10",
    },
    surface: {
      solid: "bg-dark text-background",
      outline:
        "border border-border-input text-text-main hover:bg-surface-hover",
      ghost: "text-text-main hover:bg-surface-hover",
    },
    light: {
      solid: "bg-gray-200 text-gray-500 dark:bg-gray-400 dark:text-gray-100",
      outline: "border border-gray-400 text-black hover:bg-gray-100",
      ghost: "bg-black text-background hover:bg-gray-800",
    },

    red: {
      solid: "bg-danger text-background hover:bg-red-600",
      outline: "border border-red-500 text-red-500 hover:bg-red-100",
      ghost: "text-red-500 hover:bg-red-100",
    },

    blue: {
      solid: "bg-blue-500 text-background hover:bg-blue-600",
      outline: "border border-blue-500 text-blue-500 hover:bg-blue-100",
      ghost: "text-blue-500 hover:bg-blue-100",
    },
  };

  return (
    <button
      type={type}
      disabled={disabled || (loading && loaderType === "bounce")}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-medium relative",
        "select-none transition-all shadow-sm",
        loading && loaderType === "bounce"
          ? "bg-black text-background cursor-not-allowed opacity-70"
          : baseColors[color][variant],
        sizes[size],
        shapes[shape],
        fullWidthOnMobile && "w-full sm:w-auto",
        disabled && "opacity-50 cursor-not-allowed",

        className,
      )}
      style={{
        maxWidth: width,
        height,
        width,
        transitionDuration: `${animationSpeed}ms`,
      }}
      {...props}
    >
      {Icon && iconPosition === "left" && (
        <Icon
          className={clsx(
            "w-4 h-4 sm:w-5 sm:h-5",
            loading && loaderType === "bounce" && "invisible",
          )}
        />
      )}
      <span
        className={clsx(
          "inline-flex items-center justify-center",
          loading && loaderType === "bounce" && "invisible",
        )}
      >
        {text}
      </span>
      {loading && loaderType === "bounce" && (
        <span className="absolute flex items-center justify-center">
          <div className="loader" />
        </span>
      )}
      {Icon && iconPosition === "right" && (
        <Icon
          className={clsx(
            "w-4 h-4 sm:w-5 sm:h-5",
            loading && loaderType === "bounce" && "invisible",
          )}
        />
      )}
    </button>
  );
};

import React from "react";
import clsx from "clsx";

interface ToggleButtonProps {
  isOn: boolean;
  onToggle: () => void;
  size?: "xs" | "sm" | "md" | "lg";
  onColor?: string;
  offColor?: string;
  knobColor?: string;
  animationSpeed?: number;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  isOn,
  onToggle,
  size = "md",
  onColor = "bg-green-500",
  offColor = "bg-red-500",
  knobColor = "bg-white",
  animationSpeed = 300,
}) => {
  const sizes = {
    xs: { w: "w-6", h: "h-3", knob: "w-2 h-2", move: "translate-x-3" },
    sm: { w: "w-10", h: "h-5", knob: "w-4 h-4", move: "translate-x-5" },
    md: { w: "w-14", h: "h-7", knob: "w-6 h-6", move: "translate-x-7" },
    lg: { w: "w-20", h: "h-10", knob: "w-8 h-8", move: "translate-x-10" },
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "relative rounded-full flex items-center transition-colors shadow-inner",
        sizes[size].w,
        sizes[size].h,
        isOn ? onColor : offColor,
      )}
      style={{ transitionDuration: `${animationSpeed}ms` }}
    >
      <span
        className={clsx(
          "absolute rounded-full transition-transform ease-in-out shadow-sm",
          "top-1/2 -translate-y-1/2",
          sizes[size].knob,
          knobColor,
          isOn ? sizes[size].move : "translate-x-0",
        )}
        style={{
          left: "0.15rem",
          transitionDuration: `${animationSpeed}ms`,
        }}
      />
    </button>
  );
};

export default ToggleButton;

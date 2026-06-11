import React from "react";
import { Icon as MdiIcon } from "@mdi/react";
import type { IconType } from "react-icons";
import { iconMap } from "./iconMap";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  ariaLabel?: string;
  strokeWidth?: number;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color,
  className,
  ariaLabel,
  strokeWidth,
  onClick,
}) => {
  const entry = iconMap[name];

  if (!entry) {
    return (
      <span className={className} aria-hidden>
        ▢
      </span>
    );
  }

  if (typeof entry === "string") {
    return (
      <span onClick={onClick} style={{ display: "inline-flex" }}>
        <MdiIcon
          path={entry}
          size={size / 24}
          color={color}
          className={className}
          aria-label={ariaLabel}
        />
      </span>
    );
  }

  const Comp = entry as IconType;

  return (
    <Comp
      size={size}
      color={color}
      className={className}
      aria-label={ariaLabel}
      strokeWidth={strokeWidth}
      onClick={onClick}
    />
  );
};

export default Icon;

"use client";

import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export default function Avatar({
  label,
  tone,
  size = "h-10 w-10",
}: {
  label: string;
  tone: string;
  size?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold",
        size,
        tone,
      )}
    >
      {label ? <span>{label}</span> : <Icon name="md:person" size={22} />}
    </div>
  );
}

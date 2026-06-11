import React from "react";
import clsx from "clsx";
export const BounceLoader = ({ classname = "loaderformessageArea" }) => {
  return (
    <div className="flex items-center justify-center">
      <div className={classname} />
    </div>
  );
};

export type StatusType =
  | "All"
  | "Active"
  | "Inactive"
  | "Banned"
  | "Success"
  | "Failure"
  | "Pending"
  | "Rejected"
  | "Approved"
  | "Expired"
  | "Upcoming"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "PROCESSING"
  | "SCHEDULE";

interface StatusBadgeProps {
  status: StatusType;
  onClick?: (e: React.MouseEvent) => void;
  loading?: boolean;
  className?: string;
  displayText?: string;
  textSize?: "xs" | "sm" | "base" | "lg" | "xl";
  icon?: React.ReactNode;
}

const STATUS_CLASSES: Record<Exclude<StatusType, "All">, string> = {
  Active: "bg-green-200 text-green-700",
  Success: "bg-green-200 text-green-700",
  Approved: "bg-green-200 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-200 text-red-700",
  Inactive: "bg-red-200 text-red-700",
  Failure: "bg-red-200 text-red-600",
  Banned: "bg-red-100 text-red-600",
  Expired: "bg-red-100 text-red-600",
  Upcoming: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-200 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-200 text-green-700",
  CANCELLED: "bg-red-200 text-red-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  SCHEDULE: "bg-blue-100 text-blue-700 ",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  onClick,
  loading = false,
  className,
  displayText,
  textSize = "xs",
  icon,
}) => {
  const classes =
    status === "All"
      ? "bg-gray-200 text-gray-700"
      : STATUS_CLASSES[status] || "bg-gray-200 text-gray-700";

  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-md font-semibold inline-flex items-center justify-center gap-2 min-w-[85px] min-h-[28px] transition-all relative overflow-hidden",
        classes,
        `text-${textSize}`,
        loading ? "opacity-70 cursor-wait" : "cursor-pointer",
        className,
      )}
      onClick={(e) => {
        if (!loading && onClick) {
          onClick(e);
        }
      }}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <BounceLoader />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1 w-full">
          {icon && <span>{icon}</span>}
          <span>{displayText || status}</span>
        </div>
      )}
    </span>
  );
};

export default StatusBadge;

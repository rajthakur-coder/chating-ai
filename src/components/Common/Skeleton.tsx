import React from "react";
import clsx from "clsx";

type SkeletonType = "form" | "table" | "card" | "tabs" | "text" | "circle";

interface SkeletonProps {
  type: SkeletonType;
  rows?: number;
  columns?: number | string[];
  cardPerRow?: number;
  cardHeight?: number;
  cardWidth?: number | string;
  width?: number | string;
  height?: number | string;
}

const shimmerClass =
  "relative overflow-hidden rounded-md bg-gray-100 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite_linear] before:bg-gradient-to-r before:from-transparent before:via-gray-200/60 before:to-transparent before:content-['']";

const Skeleton: React.FC<SkeletonProps> = ({
  type,
  rows = 5,
  columns = 5,
  cardPerRow = 3,
  cardHeight = 180,
  cardWidth = "100%",
  width = "100%",
  height = 14,
}) => {
  if (type === "table") {
    const headers: (string | undefined)[] = Array.isArray(columns)
      ? columns
      : Array.from({ length: columns }, (_, index) => `col-${index}`);

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="border-b border-gray-100/80 bg-gray-50/70">
              <tr>
                {headers.map((_, index) => (
                  <th key={index} className="p-3 text-left font-medium text-gray-400">
                    <div className={clsx(shimmerClass, "h-4 w-20")} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-100/80">
                  {headers.map((_, colIndex) => (
                    <td key={colIndex} className="p-3">
                      <div className={clsx(shimmerClass, "h-3.5 w-4/5")} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className={`grid gap-5 md:grid-cols-${cardPerRow}`}>
        {Array.from({ length: rows * cardPerRow }, (_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            style={{ width: cardWidth }}
          >
            <div className={clsx(shimmerClass, "mb-3 w-full")} style={{ height: cardHeight }} />
            <div className="space-y-2">
              <div className={clsx(shimmerClass, "h-3.5 w-3/5")} />
              <div className={clsx(shimmerClass, "h-3.5 w-4/5")} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "circle") {
    return <div className={clsx(shimmerClass, "rounded-full")} style={{ width: 40, height: 40 }} />;
  }

  if (type === "tabs") {
    const tabCount = typeof columns === "number" ? columns : 4;
    return (
      <div className="flex gap-3 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
        {Array.from({ length: tabCount }, (_, index) => (
          <div key={index} className={clsx(shimmerClass, "h-8 w-24 rounded-full")} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={shimmerClass} style={{ width, height, borderRadius: 6 }} />
      ))}
    </div>
  );
};

export default Skeleton;

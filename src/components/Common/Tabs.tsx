"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export interface Tab {
  name: string;
  key: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  selectedTab: string;
  onTabChange: (key: string) => void;
  textSize?: "sm" | "md" | "base" | "lg" | "xl";
}

const TAB_COLORS: Record<string, { countBg: string; countActiveBg: string }> = {
  All: {
    countBg: "bg-[#1C252E] text-[#FFFFFF]",
    countActiveBg: "bg-[#1C252E] text-[#FFFFFF]",
  },
  Active: {
    countBg: "bg-[#22C55E29] text-[#118057]",
    countActiveBg: "bg-[#22C55E] text-white",
  },
  Inactive: {
    countBg: "bg-[#FF563029] text-[#B71D18]",
    countActiveBg: "bg-[#FF5600] text-white",
  },
  Banned: {
    countBg: "bg-[#FFE4E6] text-[#B71D18]",
    countActiveBg: "bg-[#FF5630] text-white",
  },
  Blocked: {
    countBg: "bg-[#FFAB0029] text-[#B76E00]",
    countActiveBg: "bg-[#FFAB00] text-white",
  },
};

const TEXT_SIZE_MAP: Record<NonNullable<TabsProps["textSize"]>, string> = {
  sm: "text-sm",
  md: "text-md",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

const Tabs: React.FC<TabsProps> = ({
  tabs,
  selectedTab,
  onTabChange,
  textSize = "sm",
}) => {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [underlinePos, setUnderlinePos] = useState({ left: 0, width: 0 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const updateUnderline = () => {
      const index = tabs.findIndex((tab) => tab.key === selectedTab);
      const currentTab = tabRefs.current[index];
      const container = containerRef.current;

      if (!currentTab || !container) return;

      const rect = currentTab.getBoundingClientRect();
      const parentRect = container.getBoundingClientRect();
      setUnderlinePos({
        left: rect.left - parentRect.left + container.scrollLeft,
        width: currentTab.offsetWidth,
      });
    };

    updateUnderline();
    window.addEventListener("resize", updateUnderline);
    return () => window.removeEventListener("resize", updateUnderline);
  }, [selectedTab, tabs]);

  useEffect(() => {
    const checkScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
    };

    checkScroll();
    const container = containerRef.current;
    container?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scrollByHalf = (direction: 1 | -1) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollBy({ left: direction * (container.offsetWidth / 2), behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByHalf(-1)}
          className="absolute left-0 top-1/2 z-10 h-8 w-8 -translate-y-1/2"
        >
          <FiChevronLeft className="text-lg text-slate-500" />
        </button>
      )}

      <div
        ref={containerRef}
        role="tablist"
        className="relative ml-6 mr-7 flex items-center gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, index) => {
          const normalizedKey = tab.key.toLowerCase();
          const colorKey =
            Object.keys(TAB_COLORS).find((key) => key.toLowerCase() === normalizedKey) || "All";
          const colors = TAB_COLORS[colorKey] || TAB_COLORS.All;
          const isSelected = selectedTab.toLowerCase() === normalizedKey;

          return (
            <button
              key={tab.key}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onTabChange(tab.key)}
              className={clsx(
                "flex min-w-fit items-center gap-2 whitespace-nowrap px-0 py-2 transition-colors lg:px-3",
                TEXT_SIZE_MAP[textSize],
                isSelected ? "font-semibold text-foreground" : "text-slate-500",
              )}
            >
              {tab.icon}
              <span>{tab.name}</span>
              {typeof tab.count === "number" && (
                <span
                  className={clsx(
                    "rounded-md px-2 py-1 text-xs font-bold transition-all",
                    isSelected ? colors.countActiveBg : colors.countBg,
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
        <div
          className="absolute bottom-0 h-[3px] rounded-full bg-slate-950 transition-all duration-300"
          style={{ left: underlinePos.left, width: underlinePos.width }}
        />
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByHalf(1)}
          className="absolute right-0 top-1/2 z-10 h-8 w-8 -translate-y-1/2"
        >
          <FiChevronRight className="text-lg text-slate-500" />
        </button>
      )}
    </div>
  );
};

export default Tabs;

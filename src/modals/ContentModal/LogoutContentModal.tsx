"use client";

import React from "react";
import { RadioButton } from "@/components/shared";

interface LogoutContentModalProps {
  title: string;
  message?: string;
  allDevices: boolean;
  setAllDevices: (value: boolean) => void;
}

const LogoutContentModal: React.FC<LogoutContentModalProps> = ({
  title,
  message,
  allDevices,
  setAllDevices,
}) => {
  return (
    <div className="space-y-4 text-start">
      {title ? <h3 className="text-lg font-semibold text-foreground">{title}</h3> : null}
      {message ? <p className="text-sm font-normal text-foreground">{message}</p> : null}

      <div className="mt-4 flex flex-row gap-10">
        <RadioButton
          checked={!allDevices}
          onChange={() => setAllDevices(false)}
          label="Current Device Only"
          size="sm"
          activeColor="bg-secondary"
          borderColor="border-bordercolor"
          labelColor="text-text"
          hoverGlow
        />

        <RadioButton
          checked={allDevices}
          onChange={() => setAllDevices(true)}
          label="All Devices"
          size="sm"
          activeColor="bg-secondary"
          borderColor="border-bordercolor"
          labelColor="text-text"
          hoverGlow
        />
      </div>
    </div>
  );
};

export default LogoutContentModal;

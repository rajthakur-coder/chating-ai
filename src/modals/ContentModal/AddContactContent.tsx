"use client";

import React from "react";
import CustomInput from "@/components/shared/inputField";

interface AddContactContentProps {
  setPhone: (value: string) => void;
  phone: string;
  customName: string;
  setCustomName: (value: string) => void;
}

const AddContactContent: React.FC<AddContactContentProps> = ({
  setPhone,
  phone,
  customName,
  setCustomName,
}) => {
  return (
    <div className="flex flex-col gap-5 p-1">
      <div className="flex flex-col gap-2 text-left">
        <label className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">
          Full Name
        </label>
        <CustomInput
          value={customName}
          onChange={setCustomName}
          placeholder="e.g. Alexander Pierce"
        />
      </div>

      <div className="flex flex-col gap-2 text-left">
        <label className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">
          Phone Number
        </label>
        <CustomInput
          value={phone}
          onChange={(value) => setPhone(value.replace(/[^\d+]/g, ""))}
          placeholder="e.g. 919876543210"
          type="tel"
        />

        <div className="flex items-center gap-1.5 px-1">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <p className="text-[11px] font-medium italic text-slate-400">
            Enter number with country code, for example 91XXXXXXXXXX
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddContactContent;

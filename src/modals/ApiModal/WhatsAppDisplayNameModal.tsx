"use client";

import { useState } from "react";
import BaseModal from "../BaseModals/BaseModal";
import CustomInput from "@/components/Common/inputField";
import { ToasterUtils } from "@/components/ui/toast";

interface WhatsAppDisplayNameModalProps {
  isOpen: boolean;
  toggle: () => void;
  initialValue: string;
  onSuccess: (name: string) => void;
}

const WhatsAppDisplayNameModal = ({
  isOpen,
  toggle,
  initialValue,
  onSuccess,
}: WhatsAppDisplayNameModalProps) => {
  const [name, setName] = useState(initialValue || "Business Name");

  const handleSave = () => {
    if (!name.trim()) {
      ToasterUtils.error("Display name is required");
      return;
    }
    onSuccess(name.trim());
    ToasterUtils.success("Display name sent for review");
  };

  return (
    <BaseModal
      isOpen={isOpen}
      toggle={toggle}
      headerText="Edit Display Name"
      widthClass="max-w-[95%] md:w-[460px]"
      onCancel={toggle}
      onConfirm={handleSave}
      confirmText="Save"
      cancelText="Cancel"
    >
      <div className="space-y-4 py-2">
        <p className="text-sm text-gray-500">
          Your WhatsApp display name may go into review after update.
        </p>
        <CustomInput
          label="Display name"
          placeholder="Enter display name"
          value={name}
          onChange={setName}
        />
      </div>
    </BaseModal>
  );
};

export default WhatsAppDisplayNameModal;

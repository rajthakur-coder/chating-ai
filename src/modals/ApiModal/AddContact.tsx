"use client";

import React, { useEffect, useState } from "react";
import BaseModal from "../BaseModals/BaseModal";
import AddContactContent from "../ContentModal/AddContactContent";
import { saveContact } from "@/services/contacts";
import { runWithToast } from "@/utils/runWithToast";

interface AddContactProps {
  isOpen: boolean;
  toggle: () => void;
  contact?: {
    mobile?: string;
    customer_phone_number?: string;
    name?: string;
    profile_name?: string;
    custom_name?: string;
  } | null;
  onSave?: (contact: { customer_phone_number: string; custom_name: string }) => Promise<void> | void;
}

const AddContact: React.FC<AddContactProps> = ({
  isOpen,
  toggle,
  contact,
  onSave,
}) => {
  const [phone, setPhone] = useState("");
  const [customName, setCustomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (contact) {
      const rawPhone = contact.mobile || contact.customer_phone_number || "";
      const formattedPhone =
        rawPhone.startsWith("91") || rawPhone.startsWith("+")
          ? rawPhone
          : `91${rawPhone}`;

      setPhone(formattedPhone);
      setCustomName(contact.name || contact.profile_name || contact.custom_name || "");
      return;
    }

    setPhone("");
    setCustomName("");
  }, [isOpen, contact]);

  const normalizedPhone = phone.startsWith("+") ? phone.replace("+", "") : phone;
  const isPhoneValid = normalizedPhone.replace(/\D/g, "").length >= 10;
  const isNameValid = customName.trim().length > 0;
  const isFormValid = isPhoneValid && isNameValid;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      const payload = {
        customer_phone_number: normalizedPhone,
        custom_name: customName.trim(),
      };
      if (onSave) {
        await onSave(payload);
      } else {
        await runWithToast({
          action: () => saveContact(payload),
          getSuccessMessage: (result) => result.message || "Contact saved successfully",
          errorMessage: "Contact save failed",
        });
      }
      setIsLoading(false);
      toggle();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      toggle={toggle}
      headerText={contact ? "Edit Contact Details" : "Create New Contact"}
      onConfirm={handleSubmit}
      onCancel={toggle}
      confirmText={contact ? "Update Contact" : "Add Contact"}
      confirmDisabled={!isFormValid}
      confirmColor={
        isFormValid ? "bg-black text-background" : "bg-gray-400 text-background"
      }
      widthClass="w-[450px]"
      isLoading={isLoading}
    >
      <AddContactContent
        phone={phone}
        setPhone={setPhone}
        customName={customName}
        setCustomName={setCustomName}
      />
    </BaseModal>
  );
};

export default AddContact;

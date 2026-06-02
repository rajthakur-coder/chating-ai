"use client";

import { useEffect, useState } from "react";
import BaseModal from "../BaseModals/BaseModal";
import PhoneContentForm, {
  type PhoneProfileFormData,
} from "../ContentModal/PhoneContentForm";
import WhatsAppDisplayNameModal from "./WhatsAppDisplayNameModal";
import { ToasterUtils } from "@/components/ui/toast";

interface PhoneProfileModalProps {
  isOpen: boolean;
  toggle: () => void;
}

const emptyProfile: PhoneProfileFormData = {
  about: "",
  address: "",
  description: "",
  email: "",
  phone: "",
  profile_picture: null,
  website1: "",
  website2: "",
  category: "OTHER",
};

const PhoneProfileModal = ({ isOpen, toggle }: PhoneProfileModalProps) => {
  const [formData, setFormData] = useState<PhoneProfileFormData>(emptyProfile);
  const [displayName, setDisplayName] = useState("Business Name");
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    const raw = window.localStorage.getItem("whatapp_phone_profile");
    if (!raw) return;
    const saved = JSON.parse(raw) as PhoneProfileFormData & { displayName?: string };
    setFormData({ ...emptyProfile, ...saved });
    setDisplayName(saved.displayName || "Business Name");
  }, [isOpen]);

  const handleSave = () => {
    window.localStorage.setItem(
      "whatapp_phone_profile",
      JSON.stringify({ ...formData, profile_picture: null, displayName }),
    );
    ToasterUtils.success("Profile updated successfully!");
    toggle();
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        toggle={toggle}
        headerText="Phone Profile"
        widthClass="max-w-[95%] md:w-[950px]"
        showCloseIcon
        onCancel={toggle}
        onConfirm={handleSave}
        confirmText="Save"
        cancelText="Cancel"
        maxHeight="max-h-[78vh]"
      >
        <PhoneContentForm
          formData={formData}
          setFormData={setFormData}
          displayNameStatus={{
            new_display_name: displayName,
            new_name_status: "APPROVED",
          }}
          onEditName={() => setIsNameModalOpen(true)}
        />
      </BaseModal>

      <WhatsAppDisplayNameModal
        isOpen={isNameModalOpen}
        toggle={() => setIsNameModalOpen(false)}
        initialValue={displayName}
        onSuccess={(name) => {
          setDisplayName(name);
          setIsNameModalOpen(false);
        }}
      />
    </>
  );
};

export default PhoneProfileModal;

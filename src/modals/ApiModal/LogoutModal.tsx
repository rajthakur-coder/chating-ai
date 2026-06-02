"use client";

import React, { useState } from "react";
import BaseModal from "../BaseModals/BaseModal";
import LogoutContentModal from "../ContentModal/LogoutContentModal";

interface LogoutModalProps {
  isOpen: boolean;
  toggle: () => void;
  onLogout: (allDevices: boolean) => Promise<void> | void;
  isLoading?: boolean;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  toggle,
  onLogout,
  isLoading = false,
}) => {
  const [allDevices, setAllDevices] = useState(false);

  const handleConfirm = async () => {
    await onLogout(allDevices);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      toggle={toggle}
      showHeaderBorder={false}
      headerText="Logout From Devices"
      onConfirm={handleConfirm}
      onCancel={toggle}
      confirmText="Logout"
      cancelText="Cancel"
      confirmColor="bg-danger text-background"
      widthClass="w-[450px]"
      isLoading={isLoading}
    >
      <LogoutContentModal
        title=""
        allDevices={allDevices}
        setAllDevices={setAllDevices}
      />
    </BaseModal>
  );
};

export default LogoutModal;

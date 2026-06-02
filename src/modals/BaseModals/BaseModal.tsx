"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import clsx from "clsx";
import { FiX } from "react-icons/fi";

interface ExtraButtonProps {
  text: string;
  onClick: () => void;
  colorClass?: string;
  disabled?: boolean;
}

interface BaseModalProps {
  isOpen: boolean;
  toggle: () => void;
  children: ReactNode;
  headerText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  cancelColor?: string;
  widthClass?: string;
  minHeight?: string;
  maxHeight?: string;
  showCloseIcon?: boolean;
  headerTextColor?: string;
  headerBgClass?: string;
  isLoading?: boolean;
  confirmDisabled?: boolean;
  extraButton?: ExtraButtonProps;
  showHeaderBorder?: boolean;
  showFooterBorder?: boolean;
  contentOverflowVisible?: boolean;
}

const BaseModal = ({
  isOpen,
  toggle,
  children,
  headerText,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "bg-black hover:bg-gray-900 text-background",
  cancelColor = "bg-gray-200 hover:bg-gray-100 text-black",
  widthClass = "max-w-[95%] sm:w-[90%] md:w-[600px]",
  minHeight = "min-h-auto",
  maxHeight = "max-h-[70vh]",
  showCloseIcon = true,
  headerBgClass = "bg-transparent",
  headerTextColor = "text-text-main",
  isLoading = false,
  confirmDisabled = false,
  extraButton,
  showHeaderBorder = true,
  showFooterBorder = true,
  contentOverflowVisible = false,
}: BaseModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShake(true);
        window.setTimeout(() => setShake(false), 500);
      }
      if (event.key === "Enter" && onConfirm && !isLoading && !confirmDisabled) {
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, isLoading, confirmDisabled]);

  if (!isOpen || !mounted) return null;

  const handleBackdropClick = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={clsx(
          "flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white text-gray-800 shadow-2xl transition-all duration-150",
          widthClass,
          shake && "animate-[modal-shake_0.5s_ease-in-out]",
        )}
      >
        {(headerText || showCloseIcon) && (
          <div
            className={clsx(
              "flex flex-shrink-0 items-center justify-between p-4 px-6 md:px-8",
              headerBgClass,
              showHeaderBorder && "border-b border-bordercolor",
            )}
          >
            {headerText && (
              <h3 className={clsx("text-lg font-semibold", headerTextColor)}>
                {headerText}
              </h3>
            )}
            {showCloseIcon && (
              <button
                onClick={toggle}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
                disabled={isLoading}
              >
                <FiX className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        )}

        <div
          data-modal-scroll-container="true"
          className={clsx(
            "relative flex-1",
            contentOverflowVisible ? "overflow-visible" : "overflow-y-auto",
            minHeight,
            maxHeight,
          )}
        >
          <div className="p-4 sm:p-3 md:px-8">{children}</div>
        </div>

        {(onCancel || onConfirm || extraButton) && (
          <div
            className={clsx(
              "flex flex-shrink-0 justify-end gap-3 bg-white p-4 md:px-8",
              showFooterBorder && "border-t border-bordercolor",
            )}
          >
            {onCancel && (
              <button
                onClick={onCancel}
                className={clsx(
                  "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                  cancelColor,
                )}
                disabled={isLoading}
              >
                {cancelText}
              </button>
            )}

            {extraButton && (
              <button
                onClick={extraButton.onClick}
                disabled={extraButton.disabled || isLoading}
                className={clsx(
                  "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                  extraButton.colorClass || "bg-gray-300 hover:bg-gray-200",
                )}
              >
                {extraButton.text}
              </button>
            )}

            {onConfirm && (
              <button
                onClick={onConfirm}
                disabled={isLoading || confirmDisabled}
                className={clsx(
                  "flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                  confirmColor,
                  (isLoading || confirmDisabled) && "cursor-not-allowed opacity-60",
                )}
              >
                {isLoading ? <div className="loader" /> : confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default BaseModal;

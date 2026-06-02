"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FiX } from "react-icons/fi";
import LogoutModal from "@/modals/ApiModal/LogoutModal";
import { signOut } from "@/services/auth";

interface TopbarProfileProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const user = {
  name: "Raj",
  role: "Admin",
  profile_image: "",
};

const getInitials = (name: string) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const TopbarProfile = ({ isOpen, onToggle, onClose }: TopbarProfileProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const initials = getInitials(user.name);
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [animateAvatar, setAnimateAvatar] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timer = window.setTimeout(() => setAnimateIn(true), 5);
      return () => window.clearTimeout(timer);
    }

    setAnimateIn(false);
    setAnimateAvatar(false);
  }, [isOpen]);

  useEffect(() => {
    if (!animateIn) return;
    const timer = window.setTimeout(() => setAnimateAvatar(true), 150);
    return () => window.clearTimeout(timer);
  }, [animateIn]);

  const handleTransitionEnd = () => {
    if (!animateIn) setMounted(false);
  };

  const handleLogoutClick = () => {
    onClose();
    setLogoutOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("access_token");
      window.localStorage.removeItem("refresh_token");
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      setLogoutLoading(false);
      setLogoutOpen(false);
      window.location.assign("/dashboard");
    }
  };

  const profileTrigger = (
    <div
      onClick={onToggle}
      className={`flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border shadow-sm transition-colors duration-200 ${
        isOpen ? "bg-primary text-background" : "bg-background text-blue-500"
      }`}
    >
      <span className="text-xs font-bold">{initials}</span>
    </div>
  );

  return (
    <>
      {profileTrigger}

      {mounted &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 z-[9998] transition-opacity duration-300 ${
                animateIn ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              onClick={onClose}
            />

            <div
              onTransitionEnd={handleTransitionEnd}
              className={`fixed right-0 top-0 z-[9999] w-[350px] border-l bg-white shadow-2xl transition-transform duration-300 ease-out md:w-[400px] ${
                animateIn ? "translate-x-0" : "translate-x-full"
              }`}
              style={{ height: "100vh" }}
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
              >
                <FiX size={22} />
              </button>

              <div className="flex flex-col items-center bg-gray-50/50 pb-8 pt-16">
                <div
                  className={`flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full border-2 bg-white shadow-md transition-all duration-500 ${
                    animateAvatar ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  }`}
                >
                  <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white text-2xl font-bold text-blue-500">
                    {initials}
                  </div>
                </div>

                <div
                  className={`mt-4 flex flex-col items-center transition-all delay-100 duration-500 ${
                    animateAvatar ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  }`}
                >
                  <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                  <span className="mt-1.5 rounded-xl bg-green-200 px-3 py-1 text-xs font-semibold capitalize text-green-900">
                    {user.role}
                  </span>

                  <div className="mt-6 flex items-center gap-2 text-sm">
                    <button
                      onClick={() => {
                        onClose();
                        router.push("/profile");
                      }}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      My Profile
                    </button>

                    <span className="text-gray-400">|</span>

                    <button
                      onClick={handleLogoutClick}
                      className="font-medium text-red-500 hover:text-red-700"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      <LogoutModal
        isOpen={logoutOpen}
        toggle={() => setLogoutOpen(false)}
        onLogout={handleConfirmLogout}
        isLoading={logoutLoading}
      />
    </>
  );
};

export default TopbarProfile;

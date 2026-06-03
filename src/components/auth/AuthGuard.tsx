"use client";

import { getCurrentUser } from "@/services/auth";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

type AuthGuardProps = {
  children: ReactNode;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const isPublicPage = pathname === "/privacy" || pathname === "/login";
  // const isPublicPage = pathname === "/privacy" || pathname === "/dashboard";
  // const isPublicPage = true;



  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    enabled: Boolean(apiUrl) && !isPublicPage,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (isPublicPage) return;

    if (!apiUrl && authServiceUrl) {
      window.location.assign("/login");
      return;

      // Old external auth flow, keep this for easy rollback after testing:
      // const redirectUri = `${window.location.origin}/dashboard`;
      // const signInUrl = new URL("/sign-in", authServiceUrl);
      // signInUrl.searchParams.set("redirect_uri", redirectUri);
      // window.location.assign(signInUrl.toString());
      // return;
    }

    if (currentUserQuery.isLoading || currentUserQuery.isSuccess) return;
    if (!authServiceUrl) return;

    window.location.assign(`/login?redirect=${encodeURIComponent(window.location.href)}`);
    return;

    // Old external auth flow, keep this for easy rollback after testing:
    // const redirectUri = `${window.location.origin}/dashboard`;
    // const signInUrl = new URL("/sign-in", authServiceUrl);
    // signInUrl.searchParams.set("redirect_uri", redirectUri);
    // window.location.assign(signInUrl.toString());
  }, [
    pathname,
    isPublicPage,
    currentUserQuery.isLoading,
    currentUserQuery.isSuccess,
    currentUserQuery.isError,
  ]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (currentUserQuery.isLoading || !currentUserQuery.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}

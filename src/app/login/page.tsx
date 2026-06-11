"use client";

import Icon from "@/components/ui/Icon";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { signIn } from "@/services/auth";
import { ToasterUtils } from "@/components/ui/toast";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const redirectTarget = useMemo(() => {
    const redirect = searchParams.get("redirect");
    if (!redirect) return "/dashboard";

    try {
      const url = new URL(redirect);
      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}${url.hash}` || "/dashboard";
      }
    } catch {
      if (redirect.startsWith("/")) return redirect;
    }

    return "/dashboard";
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await signIn({ email, password });
      ToasterUtils.success("Logged in successfully.");
      router.replace(redirectTarget);
      router.refresh();
    } catch (error) {
      let message = "Login failed. Please check your email and password.";

      if (error instanceof AxiosError) {
        const detail = error.response?.data?.detail || error.response?.data?.message;
        if (typeof detail === "string") {
          message = detail;
        } else if (!error.response) {
          message = "Backend server connection failed. Please check if your server is running.";
        }
      }

      setErrorMessage(message);
      ToasterUtils.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
        <section className="hidden bg-[#101820] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-500 text-white">
              <Icon name="fi:message-circle" size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold">AlignChat</p>
              <p className="text-sm text-slate-300">WhatsApp Automation</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Test login
            </p>
            <h1 className="text-5xl font-semibold leading-tight">
              Manage your WhatsApp bot from one clean workspace.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Sign in with your existing backend account to continue testing dashboards,
              contacts, templates, and live chat.
            </p>
          </div>

          <p className="text-sm text-slate-400">Temporary screen for local testing.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[420px] rounded-md border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-7 lg:hidden">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-emerald-500 text-white">
                <Icon name="fi:message-circle" size={22} />
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                AlignChat
              </p>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Use your existing account credentials.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Icon name="fi:mail" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-950"
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Icon name="fi:lock" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-11 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-950"
                    placeholder="Password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {showPassword ? <Icon name="fi:eye-off" size={17} /> : <Icon name="fi:eye" size={17} />}
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-medium text-slate-600 dark:bg-slate-950 dark:text-slate-300">
          Loading login...
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  FiArrowDownLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCopy,
  FiEdit2,
  FiImage,
  FiInfo,
  FiRefreshCw,
  FiSend,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/Common/Button";
import PhoneProfileModal from "@/modals/ApiModal/PhoneProfileModal";
import {
  getWhatsappCredential,
  setupWhatsappNumber,
  type WhatsAppNumberSetupPayload,
} from "@/services/meta";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ToasterUtils } from "@/components/ui/toast";

type MetaLoginResponse = {
  authResponse?: {
    code?: string;
  };
};

type WhatsappSignupEvent = {
  event?: string;
  data?: {
    phone_number_id?: string;
    waba_id?: string;
    business_id?: string;
  };
};

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB?: {
      init: (options: Record<string, unknown>) => void;
      login: (
        callback: (response: MetaLoginResponse) => void,
        options: Record<string, unknown>,
      ) => void;
    };
  }
}

const outgoingData = [
  { label: "1-5", sent: 18, delivered: 45, read: 31, failed: 6, error: 4 },
  { label: "6-10", sent: 22, delivered: 52, read: 42, failed: 8, error: 2 },
  { label: "11-15", sent: 15, delivered: 39, read: 35, failed: 5, error: 3 },
  { label: "16-20", sent: 27, delivered: 60, read: 46, failed: 4, error: 2 },
  { label: "21-25", sent: 24, delivered: 48, read: 44, failed: 7, error: 5 },
  { label: "26-30", sent: 30, delivered: 64, read: 50, failed: 3, error: 1 },
];

const incomingData = [
  { label: "1-5", count: 24 },
  { label: "6-10", count: 36 },
  { label: "11-15", count: 28 },
  { label: "16-20", count: 44 },
  { label: "21-25", count: 41 },
  { label: "26-30", count: 52 },
];

const InfoCard = ({
  onPrimaryClick,
  primaryLoading,
}: {
  onPrimaryClick: () => void;
  primaryLoading: boolean;
}) => (
  <div className="relative mx-auto mt-4 flex w-full flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] md:flex-row md:items-start md:gap-12 md:p-10 lg:p-12">
    <div className="order-2 flex-1 space-y-4 text-center md:order-1 md:space-y-6 md:text-left">
      <div>
        <h2 className="mb-2 text-xl font-bold tracking-tight text-slate-900 md:mb-4 md:text-3xl">
          Start WhatsApp Engagement for your Business
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-slate-600 md:text-lg">
          Apply for WhatsApp Business API or migrate from another provider.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 md:justify-start lg:flex-row">
        <Button
          text="Apply for WhatsApp Business API (FREE)"
          onClick={onPrimaryClick}
          color="secondary"
          size="md"
          fullWidthOnMobile
          loading={primaryLoading}
          loaderType="bounce"
          disabled={primaryLoading}
          className="rounded-xl shadow-lg shadow-green-100"
          icon={() => <Icon name="ri:whatsapp-line" size={28} />}
        />
        <Button
          text="Migrate from Another Vendor"
          variant="outline"
          color="surface"
          size="md"
          fullWidthOnMobile
          iconPosition="right"
          className="group rounded-xl"
          icon={() => (
            <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          )}
        />
      </div>

      <button className="text-xs font-medium text-slate-600 transition hover:text-slate-950 md:text-sm">
        <span className="border-b border-transparent pb-0.5 transition hover:border-slate-900">
          Want to know more about NeroChat? Click to schedule a Live Demo.
        </span>
      </button>
    </div>

    <div className="relative order-1 shrink-0 md:order-2">
      <div className="absolute inset-0 rounded-full bg-blue-50 opacity-40 blur-2xl" />
      <Image
        src="/rocket_icon.png"
        alt="card visual"
        width={288}
        height={220}
        className="relative h-auto max-h-[150px] w-32 object-contain drop-shadow-xl transition-transform duration-700 hover:scale-105 sm:w-40 md:max-h-[220px] md:w-64 lg:w-72"
      />
    </div>
  </div>
);

const TrialBanner = () => (
  <div className="mb-6 flex flex-col items-center justify-between rounded-lg border-l-4 border-purple-700 bg-white p-4 shadow-sm md:flex-row">
    <div className="flex items-center gap-4">
      <div className="rounded-full bg-purple-50 p-2 text-purple-700">
        <FiZap size={24} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-purple-900">
          9 Days Left in Your Trial
        </h3>
        <p className="text-sm text-slate-600">
          Upgrade now to unlock all premium features!
        </p>
      </div>
    </div>
    <button className="mt-4 flex items-center gap-2 rounded-md bg-purple-800 px-6 py-2.5 font-medium text-white shadow-md transition hover:bg-purple-900 md:mt-0">
      <FiZap size={20} />
      Upgrade Now
    </button>
  </div>
);

const DashboardStats = () => (
  <div className="flex w-full flex-col gap-4">
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm md:grid-cols-3">
      <div className="flex flex-col">
        <div className="mb-1 flex items-center gap-1 text-sm text-slate-900">
          WhatsApp API Status <FiInfo className="text-slate-500" size={14} />
        </div>
        <span className="w-fit rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
          ACTIVE
        </span>
      </div>
      <div className="flex flex-col">
        <div className="mb-1 flex items-center gap-1 text-sm text-slate-600">
          Quality Rating <FiInfo className="text-slate-500" size={14} />
        </div>
        <span className="w-fit rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
          GREEN
        </span>
      </div>
      <div className="flex flex-col text-left">
        <div className="mb-1 flex items-center gap-1 text-sm text-slate-600">
          Remaining Quota <FiInfo className="text-slate-500" size={14} />
        </div>
        <span className="text-xl font-bold text-teal-600">1000</span>
      </div>
    </div>
  </div>
);

const CountCards = () => {
  const stats = [
    { title: "Total Contact", value: "248", icon: FiUsers, color: "from-blue-400 to-indigo-600" },
    { title: "Total Agents", value: "8", icon: FiSend, color: "from-emerald-400 to-teal-600" },
    { title: "Total Flow", value: "12", icon: FiBarChart2, color: "from-orange-400 to-red-500" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const IconItem = stat.icon;
        return (
          <div
            key={stat.title}
            className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className={`absolute right-0 top-0 h-24 w-24 rounded-bl-[48px] bg-gradient-to-br ${stat.color} opacity-15`} />
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
              <IconItem size={22} />
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
};

const ProfileCard = ({ onOpen }: { onOpen: () => void }) => {
  const [copied, setCopied] = useState(false);
  const websiteNumber = "alignchat.in/+919876543210";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(websiteNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <button
          onClick={onOpen}
          className="absolute right-4 top-4 rounded-full bg-gray-100 p-1.5 hover:text-gray-600"
        >
          <FiEdit2 className="text-gray-400" size={20} />
        </button>

        <div className="mb-4">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">
            Business Name
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            RETAIL
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-green-900">+91 98765 43210</h2>
            <div className="relative mt-1 flex items-center gap-1.5 text-[12px] text-gray-400">
              <span className="truncate">{websiteNumber}</span>
              <button onClick={handleCopy}>
                <FiCopy className="text-gray-400" size={16} />
              </button>
              {copied && (
                <span className="absolute -top-5 right-0 rounded bg-black px-3 py-[3px] text-[10px] text-white">
                  Copied
                </span>
              )}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <FiImage className="text-gray-400" size={18} />
          </div>
        </div>

        <button
          onClick={onOpen}
          className="mt-4 flex items-center gap-2 text-[15px] font-semibold text-primary"
        >
          View Profile
          <FiArrowDownLeft className="text-gray-400" size={20} />
        </button>
      </div>
    </div>
  );
};

const ChartCard = ({
  title,
  icon,
  tone,
  data,
  stacked = false,
}: {
  title: string;
  icon: React.ReactNode;
  tone: string;
  data: typeof outgoingData | typeof incomingData;
  stacked?: boolean;
}) => {
  const max = Math.max(
    ...data.map((item) =>
      "count" in item
        ? item.count
        : item.sent + item.delivered + item.read + item.failed + item.error,
    ),
  );

  return (
    <div className="flex min-h-[480px] flex-col rounded-[12px] border border-gray-200 bg-white p-4 shadow-[0_0_15px_rgba(0,0,0,0.08)] md:min-h-[500px] md:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-1.5 ${tone}`}>{icon}</div>
          <h2 className="text-lg font-bold text-slate-900 md:text-xl">{title}</h2>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          <button className="rounded-full p-2 text-slate-500 transition hover:bg-gray-50">
            <FiRefreshCw size={22} />
          </button>
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
            This Month
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-[320px] min-w-[450px] items-end gap-6 border-b border-l border-gray-100 px-4 pt-6">
          {data.map((item) => {
            const total =
              "count" in item
                ? item.count
                : item.sent + item.delivered + item.read + item.failed + item.error;
            return (
              <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-[260px] w-8 items-end overflow-hidden rounded-t-md bg-gray-100">
                  {stacked && "sent" in item ? (
                    <div className="flex w-full flex-col-reverse">
                      {[
                        ["bg-yellow-400", item.sent],
                        ["bg-green-500", item.delivered],
                        ["bg-indigo-500", item.read],
                        ["bg-rose-500", item.failed],
                        ["bg-slate-400", item.error],
                      ].map(([color, value]) => (
                        <div
                          key={color as string}
                          className={color as string}
                          style={{ height: `${((value as number) / max) * 260}px` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="w-full rounded-t-md bg-emerald-500"
                      style={{ height: `${(total / max) * 260}px` }}
                    />
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!stacked && (
        <div className="mt-auto flex items-center justify-between pt-6">
          <div className="flex items-center gap-2 text-slate-600">
            <FiInfo size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Stats Summary
            </span>
          </div>
          <div className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm md:text-sm">
            Total: {incomingData.reduce((sum, item) => sum + item.count, 0)}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const [phoneProfileOpen, setPhoneProfileOpen] = useState(false);
  const [showConnectedDashboard, setShowConnectedDashboard] = useState(false);
  const [signupEvent, setSignupEvent] = useState<WhatsappSignupEvent | null>(null);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [isFbSdkReady, setIsFbSdkReady] = useState(false);
  const [isSignupButtonLoading, setIsSignupButtonLoading] = useState(false);
  const hasSubmittedRef = useRef(false);

  const credentialQuery = useQuery({
    queryKey: ["whatsapp-credential"],
    queryFn: getWhatsappCredential,
    retry: false,
  });

  const metaSignupMutation = useMutation({
    mutationFn: setupWhatsappNumber,
    onSuccess: (response) => {
      setIsSignupButtonLoading(false);
      ToasterUtils.success(
        response?.message || "WhatsApp Business setup completed successfully",
      );
      setShowConnectedDashboard(true);
      credentialQuery.refetch();
    },
    onError: (error: any) => {
      setIsSignupButtonLoading(false);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "WhatsApp Business setup failed";
      ToasterUtils.error(message);
    },
  });

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB?.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID || "1709483436742273",
        cookie: true,
        xfbml: true,
        version: "v25.0",
      });
      setIsFbSdkReady(true);
    };

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          setSignupEvent({ event: data.event, data: data.data });
          if (data.event === "CANCEL" || data.event === "ERROR") {
            setIsSignupButtonLoading(false);
          }
        }
      } catch {
        // Facebook sends non-JSON postMessage events too.
      }
    };

    window.addEventListener("message", handleMessage);
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (credentialQuery.data?.statusCode === 1) {
      setIsSignupButtonLoading(false);
      setShowConnectedDashboard(true);
    }
  }, [credentialQuery.data?.statusCode]);

  useEffect(() => {
    if (signupEvent?.event !== "FINISH" || !authCode || hasSubmittedRef.current) {
      return;
    }

    const payload: WhatsAppNumberSetupPayload = {
      authorization_token: authCode,
      phone_number_id: signupEvent.data?.phone_number_id || "",
      waba_id: signupEvent.data?.waba_id || "",
      business_id: signupEvent.data?.business_id || "",
    };

    if (!payload.phone_number_id || !payload.waba_id || !payload.business_id) {
      setIsSignupButtonLoading(false);
      ToasterUtils.error("Meta signup did not return complete WhatsApp details");
      return;
    }

    hasSubmittedRef.current = true;
    setIsSignupButtonLoading(false);
    metaSignupMutation.mutate(payload);
  }, [authCode, metaSignupMutation, signupEvent]);

  const launchWhatsAppSignup = () => {
    if (!isFbSdkReady || !window.FB) {
      ToasterUtils.error("Facebook SDK is still loading");
      return;
    }

    setSignupEvent(null);
    setAuthCode(null);
    setIsSignupButtonLoading(true);
    hasSubmittedRef.current = false;

    window.FB.login(
      (response: MetaLoginResponse) => {
        if (response.authResponse?.code) {
          setAuthCode(response.authResponse.code);
          return;
        }
        setIsSignupButtonLoading(false);
        ToasterUtils.error("Signup cancelled");
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID || "978170104695778",
        response_type: "code",
        override_default_response_type: true,
        extras: { sessionInfoVersion: 3 },
      },
    );
  };

  const totalOutgoing = useMemo(
    () =>
      outgoingData.reduce(
        (sum, item) => sum + item.sent + item.delivered + item.read + item.failed,
        0,
      ),
    [],
  );

  return (
    <div className="bg-gray-50 p-4 md:p-5">
      {!showConnectedDashboard ? (
        <InfoCard
          onPrimaryClick={launchWhatsAppSignup}
          primaryLoading={isSignupButtonLoading || metaSignupMutation.isPending}
        />
      ) : (
        <div className="mt-4">
          <TrialBanner />

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-3 lg:col-span-2">
              <DashboardStats />
              <CountCards />
            </div>
            <ProfileCard onOpen={() => setPhoneProfileOpen(true)} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Outgoing Traffic"
              tone="bg-blue-50 text-blue-600"
              icon={<FiArrowUpRight size={18} />}
              data={outgoingData}
              stacked
            />
            <ChartCard
              title="Incoming Traffic"
              tone="bg-emerald-50 text-emerald-600"
              icon={<FiArrowDownLeft size={18} />}
              data={incomingData}
            />
          </div>

          <div className="mt-3 text-right text-xs font-medium text-slate-500">
            Total outgoing activity: {totalOutgoing.toLocaleString()}
          </div>
        </div>
      )}

      <PhoneProfileModal
        isOpen={phoneProfileOpen}
        toggle={() => setPhoneProfileOpen(false)}
      />
    </div>
  );
}

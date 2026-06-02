"use client";

import { useMemo, useState } from "react";
import {
  FiCamera,
  FiClock,
  FiFileText,
  FiPlus,
  FiShield,
  FiUser,
} from "react-icons/fi";
import Tabs from "@/components/Common/Tabs";
import CustomInput from "@/components/Common/inputField";
import { Button } from "@/components/Common/Button";
import StatusBadge from "@/components/Common/StatusBadge";
import Pagination from "@/components/Common/Pagination";
import { ToasterUtils } from "@/components/ui/toast";

type ProfileTab = "Profile" | "Billing Profile" | "Password" | "LoginHistory";

const getInitials = (name: string) => {
  if (!name.trim()) return "U";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const loginHistory = [
  {
    id: 1,
    ip: "103.76.12.44",
    browser: "Chrome",
    os: "Windows",
    device: "Desktop",
    loginTime: "18/05/2026 04:35 PM",
    status: "SUCCESS",
  },
  {
    id: 2,
    ip: "103.76.12.44",
    browser: "Chrome",
    os: "Windows",
    device: "Desktop",
    loginTime: "17/05/2026 10:14 AM",
    status: "SUCCESS",
  },
  {
    id: 3,
    ip: "49.36.88.12",
    browser: "Edge",
    os: "Windows",
    device: "Laptop",
    loginTime: "16/05/2026 08:02 PM",
    status: "SUCCESS",
  },
];

const ProfileInfoCard = ({
  name,
  profileImage,
  onImageChange,
}: {
  name: string;
  profileImage: string;
  onImageChange: (file: File) => void;
}) => {
  const initials = getInitials(name);

  return (
    <div className="min-h-[380px] rounded-2xl border border-gray-200 bg-white px-6 py-8 text-slate-900 shadow-sm lg:w-1/3">
      <div className="flex flex-col items-center">
        <label className="group relative mb-4 flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-gray-50 shadow-md">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl font-bold tracking-tight text-blue-500">
              {initials}
            </span>
          )}
          <span className="absolute inset-0 hidden items-center justify-center bg-black/30 text-white transition group-hover:flex">
            <FiCamera className="h-7 w-7" />
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImageChange(file);
            }}
          />
        </label>

        <p className="mb-6 text-center text-xs text-gray-500">
          Allowed *.jpeg, *.png, *.gif <br /> max size of 3 Mb
        </p>

        <div className="flex w-full flex-col items-center gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-medium">Status:</span>
            <StatusBadge status="Active" className="!cursor-default text-xs" />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">Email Verified:</span>
            <StatusBadge
              status="Active"
              displayText="Verified"
              className="!cursor-default text-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">Mobile Verified:</span>
            <StatusBadge
              status="Inactive"
              displayText="Not Verified"
              className="!cursor-default text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const BillingProfile = () => {
  const [created, setCreated] = useState(false);

  if (!created) {
    return (
      <button
        type="button"
        onClick={() => {
          setCreated(true);
          ToasterUtils.success("Billing profile created");
        }}
        className="flex min-h-[208px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-300 bg-white transition hover:border-purple-500 hover:bg-purple-50 lg:w-1/3"
      >
        <FiPlus className="mb-2 h-9 w-9 text-purple-600" />
        <span className="text-lg font-semibold text-purple-600">
          Create Billing Profile
        </span>
      </button>
    );
  }

  return (
    <div className="flex h-52 w-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:w-1/3">
      <div>
        <p className="truncate pr-8 text-xl font-bold capitalize text-slate-900">
          Raj Business
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
          Office No. 12, Business Park, Ahmedabad, Gujarat - 380015
        </p>
        <p className="mt-2 text-sm text-slate-900">
          <span className="font-medium text-slate-600">GSTIN:</span>{" "}
          24ABCDE1234F1Z5
        </p>
      </div>
      <StatusBadge status="Active" textSize="sm" displayText="Default" />
    </div>
  );
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Profile");
  const [name, setName] = useState("Raj");
  const [company, setCompany] = useState("AlignChat");
  const [email, setEmail] = useState("raj@example.com");
  const [phone, setPhone] = useState("9876543210");
  const [twoFA, setTwoFA] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const tabs = useMemo(
    () => [
      { name: "Profile", key: "Profile", icon: <FiUser /> },
      {
        name: "Billing Profile",
        key: "Billing Profile",
        icon: <FiFileText />,
      },
      { name: "Password", key: "Password", icon: <FiShield /> },
      {
        name: "Login History",
        key: "LoginHistory",
        icon: <FiClock />,
      },
    ],
    [],
  );

  const passwordValid =
    currentPassword.trim() &&
    newPassword.trim() &&
    confirmPassword.trim() &&
    newPassword === confirmPassword;

  const handleProfileSave = () => {
    ToasterUtils.success("Profile updated");
  };

  const handlePasswordSave = () => {
    if (!passwordValid) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    ToasterUtils.success("Password changed successfully");
  };

  const renderContent = () => {
    if (activeTab === "Billing Profile") {
      return <BillingProfile />;
    }

    if (activeTab === "Password") {
      return (
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ensure your account is secure by using a strong password.
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <CustomInput
              label="Current Password"
              placeholder="Enter Current Password..."
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <CustomInput
              label="New Password"
              placeholder="Enter New Password..."
              type="password"
              value={newPassword}
              onChange={setNewPassword}
            />
            <CustomInput
              label="Confirm New Password"
              placeholder="Enter Confirm Password..."
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={Boolean(confirmPassword && newPassword !== confirmPassword)}
              helperText={
                confirmPassword && newPassword !== confirmPassword
                  ? "Password does not match"
                  : undefined
              }
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              text="Save changes"
              width="160px"
              height="40px"
              disabled={!passwordValid}
              onClick={handlePasswordSave}
              className={
                passwordValid
                  ? "!bg-black !text-white hover:!bg-gray-800"
                  : "!bg-gray-300 !text-gray-500"
              }
            />
          </div>
        </div>
      );
    }

    if (activeTab === "LoginHistory") {
      return (
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-gray-200 p-5 sm:grid-cols-2">
            <CustomInput label="Start Date" type="text" value="2026-05-18" onChange={() => {}} />
            <CustomInput label="End Date" type="text" value="2026-05-18" onChange={() => {}} />
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="sticky top-0 bg-gray-200">
                <tr className="text-[15px] text-slate-900">
                  {["#", "IP Address", "Browser", "OS", "Device", "Login Time", "Status"].map(
                    (header) => (
                      <th key={header} className="px-6 py-4 font-semibold">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loginHistory.map((item) => (
                  <tr key={item.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.id}</td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-700">{item.ip}</td>
                    <td className="px-6 py-4 text-slate-900">{item.browser}</td>
                    <td className="px-6 py-4 text-slate-900">{item.os}</td>
                    <td className="px-6 py-4 text-slate-900">{item.device}</td>
                    <td className="px-6 py-4 text-slate-900">{item.loginTime}</td>
                    <td className="px-6 py-4">
                      <span className="rounded border border-green-200 bg-green-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-green-700">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 px-4 py-2">
            <Pagination
              currentPage={currentPage}
              totalPages={1}
              onPageChange={setCurrentPage}
              pageSize={10}
              totalItems={loginHistory.length}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 lg:flex-row">
        <ProfileInfoCard
          name={name}
          profileImage={profileImage}
          onImageChange={(file) => {
            setProfileImage(URL.createObjectURL(file));
            ToasterUtils.success("Profile image updated successfully");
          }}
        />
        <div className="space-y-6 lg:w-2/3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
              <CustomInput
                label="Name"
                placeholder="Enter Name..."
                value={name}
                onChange={setName}
              />
              <CustomInput
                label="Company Name"
                placeholder="Enter company name..."
                value={company}
                onChange={setCompany}
              />
              <CustomInput
                label="Email Address"
                placeholder="Enter Email address..."
                value={email}
                onChange={setEmail}
                type="email"
              />
              <CustomInput
                label="Phone Number"
                placeholder="Enter Phone number..."
                value={phone}
                onChange={setPhone}
                type="tel"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                text="Save changes"
                size="sm"
                width="160px"
                height="42px"
                onClick={handleProfileSave}
                className="!bg-black !font-semibold !text-white hover:!bg-gray-900"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Two-Factor Authentication
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Increase account security by enabling OTP verification during login.
            </p>
            <Button
              text={twoFA ? "Disable 2FA" : "Enable 2FA"}
              size="sm"
              width="140px"
              height="40px"
              onClick={() => {
                setTwoFA((prev) => !prev);
                ToasterUtils.success(twoFA ? "2FA disabled" : "2FA enabled");
              }}
              className={`mt-4 !font-bold ${
                twoFA
                  ? "!bg-red-500 !text-white hover:!bg-red-600"
                  : "!bg-green-600 !text-white hover:!bg-green-700"
              }`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-96px)] flex-col overflow-hidden">
      <Tabs
        tabs={tabs}
        selectedTab={activeTab}
        onTabChange={(key) => setActiveTab(key as ProfileTab)}
      />
      <div className="mt-3 flex-1 overflow-y-auto rounded-xl bg-gray-50 p-4 md:p-6">
        {renderContent()}
      </div>
    </div>
  );
}

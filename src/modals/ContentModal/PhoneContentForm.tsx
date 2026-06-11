"use client";

import Icon from "@/components/ui/Icon";
import React from "react";
import CustomInput from "@/components/shared/inputField";
import FileUploadField from "@/components/shared/FileUpload";

export interface PhoneProfileFormData {
  about: string;
  address: string;
  description: string;
  email: string;
  phone: string;
  profile_picture: string | File | null;
  website1: string;
  website2: string;
  category: string;
}

interface PhoneContentFormProps {
  formData: PhoneProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<PhoneProfileFormData>>;
  displayNameStatus?: {
    new_display_name: string;
    new_name_status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  };
  onEditName: () => void;
}

const categoryOptions = ["OTHER", "RETAIL", "SERVICE", "EDUCATION", "HEALTH"];

const getProfileImagePreview = (value: string | File | null) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return URL.createObjectURL(value);
};

const PhoneContentForm: React.FC<PhoneContentFormProps> = ({
  formData,
  setFormData,
  displayNameStatus,
  onEditName,
}) => {
  const handleChange = (name: keyof PhoneProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const previewImage = getProfileImagePreview(formData.profile_picture);

  const statusColor =
    displayNameStatus?.new_name_status === "APPROVED"
      ? "text-green-600"
      : displayNameStatus?.new_name_status === "REJECTED"
        ? "text-red-600"
        : "text-yellow-600";

  return (
    <div className="grid grid-cols-1 gap-8 py-2 md:grid-cols-2">
      <div className="flex h-full flex-col rounded-xl border border-gray-100 bg-gray-50 p-6">
        <div className="h-fit w-full overflow-hidden rounded-lg bg-white text-[13px] shadow-lg">
          <div className="flex items-center justify-between p-4">
            <Icon name="fi:arrow-left" className="text-gray-400" size={20} />
            <Icon name="fi:more-vertical" className="text-gray-400" size={20} />
          </div>

          <div className="flex flex-col items-center px-4 pb-4 text-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
              {previewImage ? (
                <img src={previewImage} alt="profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-emerald-600">Logo</span>
              )}
            </div>

            <h3 className="text-lg font-bold text-green-800">
              {displayNameStatus?.new_display_name || "Business Name"}
            </h3>
            <p className="font-medium text-gray-500">
              {formData.phone || "+91 00000 00000"}
            </p>

            <div className="mt-4 flex flex-col items-center">
              <div className="mb-1 rounded-full bg-emerald-50 p-2 text-emerald-700">
                <Icon name="fi:share2" size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-700">Share</span>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-4 p-4 text-gray-600">
            <div className="flex gap-3">
              <Icon name="fi:home" className="mt-0.5 shrink-0 text-gray-400" size={16} />
              <p className="overflow-hidden text-ellipsis break-words text-xs leading-tight">
                {formData.description || "Description goes here..."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Icon name="fi:globe" className="text-gray-400" size={16} />
              <p>{formData.category || "Category"}</p>
            </div>
            <div className="flex gap-3">
              <Icon name="fi:map-pin" className="mt-0.5 shrink-0 text-gray-400" size={16} />
              <p className="text-xs text-blue-500">{formData.address || "Address"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Icon name="fi:mail" className="text-gray-400" size={16} />
              <p className="text-xs font-medium text-blue-500">
                {formData.email || "Email"}
              </p>
            </div>
            {[formData.website1, formData.website2].filter(Boolean).map((website) => (
              <div key={website} className="flex items-center gap-3">
                <Icon name="fi:globe" className="text-gray-400" size={16} />
                <p className="text-xs font-medium text-blue-500">{website}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 w-full text-center text-[12px] text-gray-400">
          This experience may look different across devices.
        </div>
      </div>

      <div className="space-y-6">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800">Phone Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose the photo, name and number people will see when they get a
            marketing message from you.
          </p>
        </section>

        <FileUploadField
          name="profile_picture"
          label="Profile picture"
          value={formData.profile_picture}
          onChange={(file) =>
            setFormData((prev) => ({ ...prev, profile_picture: file }))
          }
          previewSize={80}
        />

        <section className="space-y-2">
          <h4 className="font-semibold text-gray-800">Display name</h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium text-green-800">
                {displayNameStatus?.new_display_name || "Business Name"}
              </p>
              {displayNameStatus && (
                <span className={`rounded-full border bg-gray-50 px-2 py-0.5 text-xs font-semibold ${statusColor}`}>
                  {displayNameStatus.new_name_status.replace("_", " ")}
                </span>
              )}
            </div>
            <button
              type="button"
              className="w-fit rounded-md border border-gray-300 px-6 py-2 text-sm font-medium hover:bg-gray-50"
              onClick={onEditName}
            >
              Edit
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <section>
            <h2 className="text-xl font-semibold text-gray-800">
              Business Information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add some details about your Business.
            </p>
          </section>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-800">Category</label>
            <select
              value={formData.category}
              onChange={(event) => handleChange("category", event.target.value)}
              className="h-[45px] rounded-[5px] border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <CustomInput
            label="Description"
            placeholder="Enter description"
            value={formData.description}
            onChange={(value) => handleChange("description", value)}
            multiline
            rows={4}
            optional
          />
          <CustomInput
            label="Address"
            placeholder="Enter address"
            value={formData.address}
            onChange={(value) => handleChange("address", value)}
            optional
          />
          <CustomInput
            label="Email"
            placeholder="Enter email"
            type="email"
            value={formData.email}
            onChange={(value) => handleChange("email", value)}
            optional
          />
          <CustomInput
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(value) => handleChange("phone", value)}
            optional
          />
          <CustomInput
            label="Website 1"
            placeholder="https://example1.com"
            value={formData.website1}
            onChange={(value) => handleChange("website1", value)}
            optional
          />
          <CustomInput
            label="Website 2"
            placeholder="https://example2.com"
            value={formData.website2}
            onChange={(value) => handleChange("website2", value)}
            optional
          />
        </section>
      </div>
    </div>
  );
};

export default PhoneContentForm;

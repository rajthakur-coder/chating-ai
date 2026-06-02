import React, { useRef, useState, useEffect } from "react";

interface FileUploadFieldProps {
  name: string;
  label?: string;
  accept?: string;
  onChange?: (file: File | null) => void;
  value?: File | string | null;
  error?: string;
  previewSize?: number;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  name,
  label = "Choose File",
  accept = "image/*",
  onChange,
  value,
  error,
  previewSize = 80,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    if (typeof value === "string") {
      setPreview(value);
      return;
    }

    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    onChange?.(file);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block mb-2 text-sm font-medium text-text-main"
        >
          {label}
        </label>
      )}

      <input
        id={name}
        type="file"
        name={name}
        accept={accept}
        ref={inputRef}
        className="hidden"
        onChange={handleChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full overflow-hidden text-sm border border-gray-700 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
      >
        <span className="h-full px-4 py-3 text-background bg-black rounded-s-lg">
          {value ? "Change" : "Choose File"}
        </span>
        {/* In FileUploadField.tsx */}
        <span className="flex h-full px-4 py-3 overflow-hidden text-text-main grow truncate">
          {value instanceof File
            ? value.name
            : typeof value === "string" && value
              ? "Existing File"
              : "No file chosen"}
        </span>
      </button>

      {preview && (
        <div className="mt-3">
          <img
            src={preview}
            alt="Preview"
            className="object-cover border rounded-lg"
            style={{
              width: `${previewSize}px`,
              height: `${previewSize}px`,
            }}
          />
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default FileUploadField;

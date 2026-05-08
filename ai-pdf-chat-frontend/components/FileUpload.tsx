"use client";
import React, { useRef } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";
import { useUpload } from "../hooks/useUpload";
import { useTheme } from "@/context/ThemeContext";

const FileUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUpload();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <div className="p-6 h-full flex flex-col gap-4">
        <div className="mb-2">
          <p className="text-[10px] tracking-[0.3em] text-amber-400/70 uppercase font-mono mb-1">
            Document Vault
          </p>
          <h2
            className={`text-xl font-semibold tracking-tight ${dark ? "text-white/90" : "text-gray-800"}`}
          >
            Your Files
          </h2>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className={`group relative w-full cursor-pointer overflow-hidden rounded-xl border p-5
            flex flex-col justify-center items-center gap-3 transition-all duration-300
            ${
              dark
                ? "border-white/10 bg-white/5 hover:border-amber-400/40 hover:bg-amber-400/5"
                : "border-black/10 bg-black/5 hover:border-amber-500/40 hover:bg-amber-500/5"
            }`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div
            className={`w-12 h-12 rounded-full border flex items-center justify-center group-hover:scale-110 transition-transform duration-300
            ${dark ? "bg-amber-400/10 border-amber-400/20" : "bg-amber-500/10 border-amber-500/20"}`}
          >
            <FaCloudUploadAlt className="text-amber-400 text-xl" />
          </div>
          <div className="text-center">
            <p
              className={`text-sm font-medium transition-colors ${dark ? "text-white/80 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"}`}
            >
              Upload PDF
            </p>
            <p
              className={`text-[11px] mt-0.5 font-mono ${dark ? "text-white/30" : "text-gray-400"}`}
            >
              Click to browse files
            </p>
          </div>
        </button>
      </div>
    </>
  );
};

export default FileUpload;

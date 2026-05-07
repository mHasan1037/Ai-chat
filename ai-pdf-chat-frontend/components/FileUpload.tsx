"use client";
import React, { useRef } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";
import { useUpload } from "../hooks/useUpload";

const FileUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUpload();

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
        {/* Header */}
        <div className="mb-2">
          <p className="text-[10px] tracking-[0.3em] text-amber-400/70 uppercase font-mono mb-1">
            Document Vault
          </p>
          <h2 className="text-xl font-semibold text-white/90 tracking-tight">
            Your Files
          </h2>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col justify-center items-center gap-3 transition-all duration-300 hover:border-amber-400/40 hover:bg-amber-400/5"
        >
          {/* Shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <FaCloudUploadAlt className="text-amber-400 text-xl" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
              Upload PDF
            </p>
            <p className="text-[11px] text-white/30 mt-0.5 font-mono">
              Click to browse files
            </p>
          </div>
        </button>
      </div>
    </>
  );
};

export default FileUpload;

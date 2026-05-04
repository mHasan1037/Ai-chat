"use client"
import React, { useRef } from 'react'
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
        style={{ display: 'none' }}
      />
      <button
        className='w-full cursor-pointer bg-black text-white shadow-2xl flex justify-center items-center p-4 gap-3'
        onClick={() => fileInputRef.current?.click()}
      >
        <h3>Upload PDF File</h3>
        <FaCloudUploadAlt />
      </button>
    </>
  )
}

export default FileUpload
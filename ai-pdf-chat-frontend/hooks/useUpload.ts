import { useMutation } from "@tanstack/react-query";

type UploadPdfInput = {
  file: File;
  chatId: string;
  collectionName: string;
};

const uploadPdf = async ({ file, chatId, collectionName }: UploadPdfInput) => {
  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("chatId", chatId);
  formData.append("collectionName", collectionName);

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
};

export const useUpload = () => {
  return useMutation({
    mutationFn: uploadPdf,
    onSuccess: (data) => {
      console.log("File uploaded successfully:", data);
    },
    onError: (error) => {
      console.error("Error uploading file:", error);
    },
  });
};

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/authClient";

type UploadPdfInput = {
  file: File;
  chatId: string;
  collectionName: string;
};

type UploadPdfResponse = {
  message: string;
  chatId: string;
  collectionName: string;
  file: {
    filename: string;
    originalName: string;
    path: string;
    url?: string;
    cloudinaryPublicId?: string;
    size: number;
    mimetype: string;
  };
};

const uploadPdf = async ({ file, chatId, collectionName }: UploadPdfInput) => {
  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("chatId", chatId);
  formData.append("collectionName", collectionName);

  return apiRequest<UploadPdfResponse>("/upload", {
    method: "POST",
    body: formData,
  });
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

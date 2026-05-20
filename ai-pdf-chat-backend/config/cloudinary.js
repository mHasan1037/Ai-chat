import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

const configureCloudinary = () => {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloud_name || !api_key || !api_secret) return false;

  cloudinary.config({ cloud_name, api_key, api_secret });
  return true;
};

export const uploadPdfToCloudinary = async (filePath, chatId) => {
  if (!configureCloudinary()) return null;

  return cloudinary.uploader.upload(filePath, {
    resource_type: "raw",
    folder: "ai-pdf-chat/pdfs",
    public_id: chatId,
    overwrite: true,
  });
};

export const deletePdfFromCloudinary = async (publicId) => {
  if (!publicId || !configureCloudinary()) return;

  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
};
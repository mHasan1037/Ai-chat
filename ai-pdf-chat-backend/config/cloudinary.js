import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

const isDummyValue = (value = "") =>
  !value || value.trim().toLowerCase().startsWith("dummy");

const getCloudinaryConfig = () => ({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

export const isCloudinaryConfigured = () => {
  const config = getCloudinaryConfig();

  return (
    !isDummyValue(config.cloud_name) &&
    !isDummyValue(config.api_key) &&
    !isDummyValue(config.api_secret)
  );
};

const configureCloudinary = () => {
  if (!isCloudinaryConfigured()) return false;

  cloudinary.config(getCloudinaryConfig());
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

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};

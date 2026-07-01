import { UploadStatus } from "../types/pdf.types";

export const STATUS_MESSAGES: Record<UploadStatus, string> = {
  uploading: "PDF is uploading...",
  processing: "PDF is being processed...",
  ready: "PDF is ready!",
  failed: "PDF processing failed.",
};
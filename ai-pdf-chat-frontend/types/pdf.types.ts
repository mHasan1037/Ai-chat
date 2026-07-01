export type UploadStatus = "uploading" | "processing" | "ready" | "failed";

export interface PdfStatusResponse {
  uploadStatus: UploadStatus;
  error?: string;
}

export interface UploadPdfResponse {
  chatId: string;
  message: string;
}
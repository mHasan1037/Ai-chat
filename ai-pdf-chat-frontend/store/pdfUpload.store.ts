// store/pdfUpload.store.ts
import { create } from "zustand";  // ← this was missing
import { UploadStatus } from "@/types/pdf.types";  // ← fix alias to match your project

interface PdfUploadState {
  chatId: string | undefined;
  pollingEnabled: boolean;
  uploadStatus: UploadStatus | undefined;
  errorMessage: string | undefined;
  isChatReady: boolean;

  startPolling: (chatId: string) => void;
  stopPolling: () => void;
  setStatus: (status: UploadStatus, error?: string) => void;
  reset: () => void;
}

const initialState: Omit<PdfUploadState, "startPolling" | "stopPolling" | "setStatus" | "reset"> = {
  chatId: undefined,
  pollingEnabled: false,
  uploadStatus: undefined,
  errorMessage: undefined,
  isChatReady: true,
};

export const usePdfUploadStore = create<PdfUploadState>((set) => ({
  ...initialState,

  startPolling: (chatId: string) =>
    set({ chatId, pollingEnabled: true, uploadStatus: "uploading", isChatReady: false }),

  stopPolling: () => set({ pollingEnabled: false }),

  setStatus: (status: UploadStatus, error?: string) =>
    set({ uploadStatus: status, errorMessage: error, isChatReady: status === "ready" }),

  reset: () => set(initialState),
}));
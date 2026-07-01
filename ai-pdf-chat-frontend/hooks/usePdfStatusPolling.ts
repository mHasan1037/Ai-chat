import { useEffect } from "react";
import { usePdfUploadStore } from "@/store/pdfUpload.store";
import { usePdfStatus } from "@/hooks/usePdfStatus";
import { STATUS_MESSAGES } from "@/constants/pdfStatus.constants";

export const usePdfStatusPolling = (activeChatId?: string) => {
  const {
    chatId: storedChatId,
    pollingEnabled,
    uploadStatus,
    isChatReady,
    stopPolling,
    setStatus,
    reset,
  } = usePdfUploadStore();

  useEffect(() => {
    if (activeChatId && storedChatId && activeChatId !== storedChatId) {
      reset();
    }
  }, [activeChatId, storedChatId]);

  const shouldPoll = pollingEnabled && activeChatId === storedChatId;

  const { data } = usePdfStatus(storedChatId ?? "", { enabled: shouldPoll });

  useEffect(() => {
    if (!data) return;
    setStatus(data.uploadStatus, data.error);
    if (data.uploadStatus === "ready" || data.uploadStatus === "failed") {
      stopPolling();
    }
  }, [data?.uploadStatus]);

  useEffect(() => {
    if (!pollingEnabled) return;
    const timer = setTimeout(() => {
      stopPolling();
      setStatus("failed", "PDF processing timed out.");
    }, 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [pollingEnabled]);

  const statusMessage = pollingEnabled
    ? STATUS_MESSAGES[uploadStatus ?? "uploading"]
    : uploadStatus === "ready"
    ? STATUS_MESSAGES["ready"]
    : null;

  return {
    statusMessage,
    uploadStatus,
    isPolling: pollingEnabled,
    isChatReady,
    errorMessage:
      uploadStatus === "failed"
        ? (data?.error ?? "PDF processing failed.")
        : null,
  };
};
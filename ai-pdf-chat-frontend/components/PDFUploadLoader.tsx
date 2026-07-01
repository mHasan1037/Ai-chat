type UploadStatus = "processing" | "ready" | "failed" | string;

interface PDFUploadLoaderProps {
  status: UploadStatus | undefined;
  message: string;
  darkTheme: boolean;
}

const PDFUploadLoader = ({ status, message, darkTheme }: PDFUploadLoaderProps) => {
 
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
              ${
                status === "failed"
                  ? "bg-red-500/10 border border-red-500/20 text-red-400"
                  : status === "ready"
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : darkTheme
                      ? "bg-white/8 border border-white/10 text-white/70"
                      : "bg-black/5 border border-black/10 text-gray-600"
              }`}
    >
      {status !== "ready" && status !== "failed" && (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
      )}

      {status === "ready" && <span>✓</span>}
      {status === "failed" && <span>✕</span>}

      <span>{message}</span>
    </div>
  );
};

export default PDFUploadLoader;

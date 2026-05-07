"use client";
import MainChatContainer from "@/components/MainChatContainer";
import FileUpload from "../components/FileUpload";
import { useTheme } from "@/context/ThemeContext";

export default function Home() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div
      className={`flex min-h-screen w-screen overflow-hidden transition-colors duration-500
      ${dark ? "bg-[#0a0a0f] text-white" : "bg-[#f0f4f8] text-gray-900"}`}
    >
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className={`absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full blur-[120px] transition-colors duration-500
          ${dark ? "bg-amber-500/10" : "bg-blue-400/15"}`}
        />
        <div
          className={`absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] rounded-full blur-[120px] transition-colors duration-500
          ${dark ? "bg-violet-600/10" : "bg-indigo-400/15"}`}
        />
      </div>

      <div
        className={`relative z-10 w-[28vw] min-h-screen border-r transition-colors duration-500
        ${dark ? "border-white/10" : "border-black/10"}`}
      >
        <FileUpload />
      </div>

      <div className="relative z-10 w-[72vw] min-h-screen">
        <MainChatContainer />
      </div>
    </div>
  );
}

"use client";
import MainChatContainer from "@/components/MainChatContainer";
import FileUpload from "../components/FileUpload";

export default function Home() {
  return (
    <div className="flex min-h-screen w-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-[28vw] min-h-screen border-r border-white/10">
        <FileUpload />
      </div>
      <div className="relative z-10 w-[72vw] min-h-screen">
        <MainChatContainer />
      </div>
    </div>
  );
}

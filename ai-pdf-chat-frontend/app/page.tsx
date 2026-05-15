"use client";

import { useTheme } from "@/context/ThemeContext";
import FileUpload from "../components/FileUpload";
import ChatHistory from "@/components/ChatHistory";
import MainChatContainer from "@/components/MainChatContainer";
import { useHomeChat } from "@/hooks/useHomeChat";

export default function Home() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const {
    chats,
    activeChat,
    activeMessages,
    activeChatId,
    deletingChatId,
    referenceCollectionNames,
    setActiveChatId,
    updateActiveMessages,
    handleUploadStart,
    handleUploadSuccess,
    handleUploadError,
    handleDeleteChat,
  } = useHomeChat();

  return (
    <div
      className={`flex min-h-screen w-screen overflow-hidden transition-colors duration-500
      ${dark ? "bg-[#0a0a0f] text-white" : "bg-[#f0f4f8] text-gray-900"}`}
    >
      {/* Background blobs */}
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

      {/* Sidebar */}
      <div
        className={`relative z-10 w-[28vw] min-h-screen border-r transition-colors duration-500 flex flex-col
        ${dark ? "border-white/10" : "border-black/10"}`}
      >
        <FileUpload
          onUploadStart={handleUploadStart}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
        <ChatHistory
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onDeleteChat={handleDeleteChat}
          isDeletingChatId={deletingChatId}
        />
      </div>

      {/* Main chat area */}
      <div className="relative z-10 w-[72vw] min-h-screen">
        <MainChatContainer
          activeChat={activeChat}
          messages={activeMessages}
          referenceCollectionNames={referenceCollectionNames}
          onMessagesChange={updateActiveMessages}
        />
      </div>
    </div>
  );
}

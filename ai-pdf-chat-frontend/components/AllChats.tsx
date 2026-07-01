import React from "react";
import { ChatMessage } from "./MainChatContainer";
import { useTheme } from "@/context/ThemeContext";
import ChatLoader from "./ChatLoader";
import EmptyChatScreen from "./EmptyChatScreen";
import { usePdfStatusPolling } from "@/hooks/usePdfStatusPolling";
import { ChatSession } from "./ChatHistory";
import PDFUploadLoader from "./PDFUploadLoader";
import AllMessages from "./AllMessages";

type Props = {
  messages: ChatMessage[];
  aiResponseLoading: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null > | null;
  activeChat: ChatSession | null;
};

const AllChats = ({ messages, aiResponseLoading, scrollRef, activeChat }: Props) => {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { statusMessage, uploadStatus, errorMessage } = usePdfStatusPolling(activeChat?.id);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto px-6 py-6 flex flex-col gap-4
      [scrollbar-width:thin] [scrollbar-color:rgba(128,128,128,0.2)_transparent]"
    >
      {messages.length === 0 && (
        <EmptyChatScreen darkTheme={dark} />
      )}

      {messages.length === 0 && statusMessage && (
        <PDFUploadLoader status={uploadStatus} message={errorMessage ?? statusMessage} darkTheme={dark}/>
      )}

      {messages.map((msg) => (
        <AllMessages key={msg.id} msg={msg} dark={dark} />
      ))}

      {aiResponseLoading && (
        <div className="flex">
          <ChatLoader darkTheme={dark} />
        </div>
      )}
    </div>
  );
};

export default AllChats;

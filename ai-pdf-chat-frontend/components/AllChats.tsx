import React from "react";
import { ChatMessage } from "./MainChatContainer";
import { useTheme } from "@/context/ThemeContext";
import ReactMarkdown from "react-markdown";
import ChatLoader from "./ChatLoader";
import EmptyChatScreen from "./EmptyChatScreen";

type Props = {
  messages: ChatMessage[];
  aiResponseLoading: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null > | null;
};

const AllChats = ({ messages, aiResponseLoading, scrollRef }: Props) => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto px-6 py-6 flex flex-col gap-4
      [scrollbar-width:thin] [scrollbar-color:rgba(128,128,128,0.2)_transparent]"
    >
      {messages.length === 0 && (
        <EmptyChatScreen darkTheme={dark} />
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed
            ${
              msg.role === "user"
                ? "bg-amber-400 text-black font-medium rounded-br-sm"
                : dark
                  ? "bg-white/8 border border-white/10 text-white/80 rounded-bl-sm backdrop-blur-sm"
                  : "bg-white/80 border border-black/10 text-gray-700 rounded-bl-sm backdrop-blur-sm shadow-sm"
            }`}
          >
            {msg.role === "user" ? (<p>{msg.content}</p>) : (<ReactMarkdown>{msg.content}</ReactMarkdown>)}
          </div>
        </div>
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

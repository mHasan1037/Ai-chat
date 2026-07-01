import ReactMarkdown from "react-markdown";

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

interface AllMessagesProps {
  msg: Message;
  dark: boolean;
}

const AllMessages = ({ msg, dark }: AllMessagesProps) => {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-amber-400 text-black font-medium rounded-br-sm"
            : dark
              ? "bg-white/8 border border-white/10 text-white/80 rounded-bl-sm backdrop-blur-sm"
              : "bg-white/80 border border-black/10 text-gray-700 rounded-bl-sm backdrop-blur-sm shadow-sm"
        }`}
      >
        {isUser ? <p>{msg.content}</p> : <ReactMarkdown>{msg.content}</ReactMarkdown>}
      </div>
    </div>
  );
};

export default AllMessages;

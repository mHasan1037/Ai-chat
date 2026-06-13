const ChatLoader = ({ darkTheme }: { darkTheme: boolean }) => {
  return (
    <div
      className={`rounded-2xl rounded-bl-sm px-4 py-3 backdrop-blur-sm
            ${darkTheme ? "bg-white/8 border border-white/10" : "bg-white/80 border border-black/10 shadow-sm"}`}
    >
      <div className="flex gap-1.5 items-center h-4">
        <span className="w-1.5 h-1.5 bg-amber-400/70 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-amber-400/70 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-amber-400/70 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
};

export default ChatLoader;

const EmptyChatScreen = ({ darkTheme }: { darkTheme: boolean }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-24 select-none">
      <div
        className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4
            ${darkTheme ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}
      >
        <span className="text-2xl">✦</span>
      </div>
      <p
        className={`text-sm font-mono tracking-wide ${darkTheme ? "text-white/30" : "text-gray-400"}`}
      >
        Ask me anything about your documents
      </p>
    </div>
  );
};

export default EmptyChatScreen;

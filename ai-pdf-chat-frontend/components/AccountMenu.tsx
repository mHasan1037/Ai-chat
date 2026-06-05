import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from 'react'
import { FaSignOutAlt } from "react-icons/fa";

const AccountMenu = ({ dark }: { dark: boolean }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const menuRef = useRef<HTMLDivElement>(null);
  const [openTopLeftMenu, setOpenTopLeftMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const userFirstCharacter = user?.email?.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenTopLeftMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      queryClient.clear();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
      setOpenTopLeftMenu(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpenTopLeftMenu((current) => !current)}
        className={`grid h-9 w-9 cursor-pointer place-items-center rounded-full border text-sm font-semibold uppercase shadow-sm transition-all duration-300 focus:outline-none ${
          dark
            ? "border-amber-400/30 bg-amber-400/15 text-amber-200 hover:border-amber-400/60"
            : "border-amber-500/30 bg-amber-100 text-amber-700 hover:border-amber-500/60"
        }`}
        aria-label="Open account menu"
        aria-expanded={openTopLeftMenu}
      >
        {userFirstCharacter}
      </button>

      {openTopLeftMenu ? (
        <div
          className={`absolute right-0 top-12 z-30 w-56 rounded-xl border p-2 shadow-2xl ${
            dark
              ? "border-white/10 bg-[#14141c] text-white"
              : "border-black/10 bg-white text-gray-900"
          }`}
        >
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`mt-2 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              dark
                ? "text-white/75 hover:bg-red-400/10 hover:text-red-300"
                : "text-gray-700 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <FaSignOutAlt className="text-xs" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AccountMenu
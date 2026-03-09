"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { ConnectWallet } from "@/components/ConnectWallet";

export function Header() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="glass border-b border-theme sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="group flex-shrink-0">
          <Image
            src="/logo.png"
            alt="CAUSAL"
            width={140}
            height={40}
            className="transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link href="/fundraises" className="text-theme-secondary hover:text-[#4EDB72] transition text-sm font-medium">
            Browse Organizations
          </Link>
          <Link href="/fundraises/create" className="text-theme-secondary hover:text-[#4EDB72] transition text-sm font-medium">
            Launch Organization
          </Link>
          <Link href="/proposals" className="text-theme-secondary hover:text-[#4EDB72] transition text-sm font-medium">
            Trade Decisions
          </Link>
          <Link href="/faucet" className="text-theme-secondary hover:text-[#4EDB72] transition text-sm font-medium">
            Faucet
          </Link>
        </nav>

        {/* Right: theme toggle + wallet */}
        <div className="flex items-center gap-4">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none"
              style={{ backgroundColor: theme === "light" ? "#4EDB72" : "rgba(255,255,255,0.1)" }}
              aria-label="Toggle theme"
            >
              <span
                className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300"
                style={{ left: theme === "light" ? "calc(100% - 26px)" : "2px" }}
              >
                {theme === "dark" ? (
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-[#4EDB72]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </button>
          )}

          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Button } from "./button";

export function Header() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return (
    <header className="w-full flex justify-between items-center px-8 py-4 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-gray-500">
          Audit Console
        </div>
        <div className="text-lg font-semibold text-gray-100 mt-1">
          Blue Meth × Pablo Edition
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="hidden sm:inline">
          Chaos meets compliance. Leland in the loop.
        </span>
        <Button
          variant="ghost"
          onClick={() => setDark((d) => !d)}
          className="text-xs px-3 py-1"
        >
          {dark ? "☾ Dark" : "☼ Light"}
        </Button>
      </div>
    </header>
  );
}


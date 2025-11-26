"use client";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
}

export function Button({
  className,
  children,
  variant = "primary",
  ...props
}: ButtonProps) {
  const base =
    "px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200";
  const variants: Record<string, string> = {
    primary:
      "bg-[#0A84FF] hover:bg-[#1A9CFF] text-white shadow-[0_0_20px_rgba(0,132,255,0.5)] hover:shadow-[0_0_26px_rgba(0,132,255,0.8)]",
    ghost:
      "bg-transparent border border-white/10 hover:border-[#0A84FF]/70 text-gray-200 hover:text-white",
    outline:
      "bg-black/40 border border-[#0A84FF]/60 text-[#0A84FF] hover:bg-[#0A84FF]/10",
  };

  return (
    <button
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}


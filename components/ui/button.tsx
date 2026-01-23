"use client";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  prefix?: string;
}

export function Button({
  className,
  children,
  variant = "primary",
  prefix,
  ...props
}: ButtonProps) {
  const base =
    "px-5 py-2.5 text-sm font-medium font-mono transition-all duration-200 disabled:opacity-50";

  const variants: Record<string, string> = {
    primary:
      "border border-violet-500/50 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500",
    secondary:
      "border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600",
    ghost:
      "border border-transparent bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
    outline:
      "border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800/50 hover:border-slate-600",
  };

  const prefixColors: Record<string, string> = {
    primary: "text-violet-500",
    secondary: "text-emerald-500",
    ghost: "text-slate-600",
    outline: "text-amber-500",
  };

  return (
    <button
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {prefix && <span className={cn("mr-2", prefixColors[variant])}>{prefix}</span>}
      {children}
    </button>
  );
}

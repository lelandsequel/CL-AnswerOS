"use client";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ className, label, ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-slate-500 mb-1.5 font-mono">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-3 font-mono text-sm",
          "bg-slate-950 border border-slate-800",
          "text-slate-200 placeholder-slate-600",
          "focus:border-violet-500/50 focus:outline-none",
          "transition-colors duration-200",
          "min-h-[140px] resize-y",
          className
        )}
        {...props}
      />
    </div>
  );
}

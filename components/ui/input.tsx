import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className, label, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-slate-500 mb-1.5 font-mono">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-2.5 font-mono text-sm",
          "bg-slate-950 border border-slate-800",
          "text-slate-200 placeholder-slate-600",
          "focus:border-violet-500/50 focus:outline-none",
          "transition-colors duration-200",
          className
        )}
        {...props}
      />
    </div>
  );
}

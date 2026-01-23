import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'terminal';
  title?: string;
  children: React.ReactNode;
}

export function Card({ className, variant = 'default', title, children, ...props }: CardProps) {
  if (variant === 'terminal') {
    return (
      <div
        className={cn(
          "border border-slate-800 bg-slate-950 font-mono",
          className
        )}
        {...props}
      >
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          {title && <span className="ml-2 text-xs text-slate-600">{title}</span>}
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-slate-800 bg-slate-950/80 p-6 font-mono",
        className
      )}
      {...props}
    >
      {title && (
        <div className="text-xs text-slate-600 mb-4">// {title}</div>
      )}
      {children}
    </div>
  );
}

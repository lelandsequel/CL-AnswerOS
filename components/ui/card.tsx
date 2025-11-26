import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: any) {
  return (
    <div
      className={cn(
        "bg-black/40 border border-white/10 rounded-2xl p-6",
        "backdrop-blur-xl shadow-[0_0_30px_rgba(0,132,255,0.10)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}


import { cn } from "@/lib/utils";

export function Input({ className, ...props }: any) {
  return (
    <input
      className={cn(
        "w-full px-4 py-3 rounded-xl",
        "bg-black/40 border border-[#0A84FF]/40",
        "text-gray-200 placeholder-gray-500",
        "backdrop-blur-md",
        "focus:border-[#0A84FF]/70 focus:outline-none focus:ring-1 focus:ring-[#0A84FF]",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}


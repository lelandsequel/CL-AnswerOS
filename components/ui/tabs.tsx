import { cn } from "@/lib/utils";

export function Tabs({ tabs, active, setActive }: any) {
  return (
    <div className="flex space-x-3 border-b border-white/10 mt-10">
      {tabs.map((t: string) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={cn(
            "px-4 py-2 rounded-t-xl text-sm font-medium transition",
            active === t
              ? "text-[#0A84FF] border-b-2 border-[#0A84FF]"
              : "text-gray-500 hover:text-gray-300"
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}


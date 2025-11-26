"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Run Audit" },
  { href: "/audit", label: "Audit" },
  { href: "/lelandize", label: "Lelandizer" },
  { href: "/keywords", label: "Keywords" },
  { href: "/content", label: "Content" },
  { href: "/leads", label: "Leads" },
  { href: "/clients", label: "Clients" },
  { href: "/assets", label: "Assets" },
  { href: "/saved", label: "Saved Audits" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 p-6 bg-black/70 border-r border-white/10 backdrop-blur-xl flex flex-col">
      <div className="mb-8">
        <div className="text-[#0A84FF] font-bold text-2xl tracking-tight">
          LelandOS
        </div>
        <div className="text-xs text-gray-500 mt-1">
          AEO + SEO Audit Engine
        </div>
      </div>

      <nav className="flex flex-col space-y-2 text-sm">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-xl flex items-center justify-between",
                "transition-all duration-150",
                active
                  ? "bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/60 shadow-[0_0_18px_rgba(0,132,255,0.4)]"
                  : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
              )}
            >
              <span>{item.label}</span>
              {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A84FF]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 text-[10px] text-gray-500">
        It could change EVERYTHING.
      </div>
    </aside>
  );
}


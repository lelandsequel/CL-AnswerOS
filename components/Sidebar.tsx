import Link from "next/link";

export default function Sidebar() {
  const nav = [
    { name: "Audit", href: "/audit" },
    { name: "Fix Engine", href: "/fix" },
    { name: "Keywords", href: "/keywords" },
    { name: "Content Suite", href: "/content" },
    { name: "Sales Engine", href: "/sales" },
    { name: "Clients", href: "/clients" },
    { name: "Assets", href: "/assets" },
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 h-screen p-4 fixed left-0 top-0 overflow-y-auto">
      <h1 className="text-xl font-bold text-blue-300 mb-6">LELAND OS</h1>
      <nav className="space-y-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-blue-600/20 hover:text-blue-200 transition"
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}


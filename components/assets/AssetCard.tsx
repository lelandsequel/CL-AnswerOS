"use client";

import { Card } from "@/components/ui/card";
import { ClientAsset } from "@/lib/types";
import { FileText, BarChart2, File, Globe } from "lucide-react";

interface AssetCardProps {
  asset: ClientAsset;
  showClient?: boolean;
}

export function AssetCard({ asset, showClient }: AssetCardProps) {
  const Icon = getIconForType(asset.type);

  return (
    <Card className="p-4 hover:bg-white/5 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between gap-3">
        <div className="p-2 rounded-lg bg-white/5 text-[#0A84FF] group-hover:bg-[#0A84FF]/10 group-hover:text-[#0A84FF]">
          <Icon size={20} />
        </div>
        <div className="text-[10px] text-gray-500">
          {new Date(asset.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-semibold text-gray-100 line-clamp-1">
          {asset.title}
        </h3>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2 h-8">
          {asset.summary || "No summary available"}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {asset.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5"
          >
            {tag}
          </span>
        ))}
      </div>
    </Card>
  );
}

function getIconForType(type: string) {
  switch (type) {
    case "audit":
      return BarChart2;
    case "lelandized_report":
      return FileText;
    case "keyword_research":
      return Globe;
    default:
      return File;
  }
}

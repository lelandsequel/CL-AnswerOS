"use client";

import { useParams } from "next/navigation";
import { AssetList } from "@/components/assets/AssetList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ClientAssetsPage() {
  const params = useParams();
  const clientId = params.id as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" className="h-8 w-8 p-0 flex items-center justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Client Assets</h1>
          <p className="text-sm text-gray-400">
            Deliverables and saved items for this client
          </p>
        </div>
      </div>

      <AssetList clientId={clientId} />
    </div>
  );
}

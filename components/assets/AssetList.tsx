"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientAsset } from "@/lib/types";
import Spinner from "@/components/Spinner";
import { AssetCard } from "./AssetCard";

interface AssetListProps {
  // For client-specific assets (fetches data)
  clientId?: string;
  // For pre-loaded assets (global library)
  assets?: ClientAsset[];
  showClient?: boolean;
  title?: string;
  subtitle?: string;
}

export function AssetList({
  clientId,
  assets: preloadedAssets,
  showClient,
  title,
  subtitle
}: AssetListProps) {
  const safePreloadedAssets = Array.isArray(preloadedAssets) ? preloadedAssets : [];
  const [assets, setAssets] = useState<ClientAsset[]>(safePreloadedAssets);
  const [loading, setLoading] = useState(!safePreloadedAssets.length && !!clientId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (clientId && !safePreloadedAssets.length) {
      loadAssets();
    } else if (safePreloadedAssets.length) {
      setAssets(safePreloadedAssets);
    }
  }, [clientId, safePreloadedAssets.length]);

  async function loadAssets() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/client-assets?clientId=${clientId}`);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "Failed to fetch assets");
      }
      const data = JSON.parse(text);
      setAssets(data.assets || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="text-red-400 text-sm bg-red-900/20 p-4 rounded-xl border border-red-800">
        {error}
      </div>
    );
  }

  const emptyMessage = clientId
    ? "No assets found for this client."
    : "No assets found.";

  return (
    <div className="space-y-6">
      {(title || subtitle) && (
        <div>
          {title && <h2 className="text-xl font-semibold text-gray-100">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}

      {assets.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-8 border border-white/5 rounded-xl bg-white/5">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} showClient={showClient} />
          ))}
        </div>
      )}
    </div>
  );
}

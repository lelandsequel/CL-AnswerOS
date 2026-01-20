'use client';

import { useState, useEffect } from 'react';
import type { ClientAsset } from '@/lib/types';
import { Button } from '@/components/ui/button';

type AssetLoaderProps = {
  assetType: string; // e.g., "audit"
  onAssetSelected: (asset: ClientAsset) => void;
  label?: string;
  className?: string;
};

export function AssetLoader({
  assetType,
  onAssetSelected,
  label = 'Load from Asset',
  className = '',
}: AssetLoaderProps) {
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && assets.length === 0) {
      loadAssets();
    }
  }, [isOpen]);

  async function loadAssets() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/client-assets?type=${assetType}`);
      if (!res.ok) throw new Error('Failed to load assets');

      const data = await res.json();
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading assets');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAsset(asset: ClientAsset) {
    onAssetSelected(asset);
    setIsOpen(false);
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs px-3 py-1"
      >
        {label}
      </Button>

      {isOpen && (
        <div className="mt-2 p-3 border border-gray-700 rounded-lg bg-gray-900/50 max-h-64 overflow-y-auto">
          {loading && <p className="text-xs text-gray-400">Loading assets...</p>}

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {!loading && assets.length === 0 && !error && (
            <p className="text-xs text-gray-400">No {assetType} assets found</p>
          )}

          {!loading && assets.length > 0 && (
            <div className="space-y-2">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className="w-full text-left p-2 rounded hover:bg-gray-800 transition-colors text-xs"
                >
                  <div className="font-medium text-gray-100 truncate">
                    {asset.title}
                  </div>
                  <div className="text-gray-400 text-[10px] truncate">
                    {asset.summary}
                  </div>
                  <div className="text-gray-500 text-[10px] mt-1">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


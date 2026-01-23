'use client';

import { useState, useEffect } from 'react';
import type { ClientAsset } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AssetLoaderProps = {
  assetType: string; // e.g., "audit"
  onAssetSelected: (asset: ClientAsset) => void;
  label?: string;
  className?: string;
  onLoaded?: (asset: ClientAsset) => void; // Callback for toast notifications
};

export function AssetLoader({
  assetType,
  onAssetSelected,
  label = 'Load from Asset',
  className = '',
  onLoaded,
}: AssetLoaderProps) {
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<ClientAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && assets.length === 0) {
      loadAssets();
    }
  }, [isOpen]);

  // Filter assets by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Sort by newest first
      setFilteredAssets([...assets].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = assets.filter(asset =>
        asset.title.toLowerCase().includes(query) ||
        asset.summary.toLowerCase().includes(query)
      );
      setFilteredAssets(filtered.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    }
  }, [searchQuery, assets]);

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
    onLoaded?.(asset); // Trigger callback for toast
    setIsOpen(false);
    setSearchQuery(''); // Reset search
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
        <div className="mt-2 border border-gray-700 rounded-lg bg-gray-900/50 overflow-hidden">
          {/* Search Input */}
          {assets.length > 0 && (
            <div className="p-2 border-b border-gray-700">
              <Input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="text-xs h-8"
                autoFocus
              />
            </div>
          )}

          {/* Content */}
          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <p className="text-xs text-gray-400 p-3">Loading assets...</p>
            )}

            {error && (
              <p className="text-xs text-red-400 p-3">{error}</p>
            )}

            {!loading && assets.length === 0 && !error && (
              <p className="text-xs text-gray-400 p-3">
                No {assetType} assets found
              </p>
            )}

            {!loading && filteredAssets.length === 0 && assets.length > 0 && (
              <p className="text-xs text-gray-400 p-3">
                No assets match &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {!loading && filteredAssets.length > 0 && (
              <div className="space-y-1">
                {filteredAssets.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => handleSelectAsset(asset)}
                    className="w-full text-left p-2 hover:bg-gray-800 transition-colors text-xs border-b border-gray-800 last:border-b-0"
                  >
                    <div className="font-medium text-gray-100 truncate">
                      {asset.title}
                    </div>
                    <div className="text-gray-400 text-[10px] truncate">
                      {asset.summary}
                    </div>
                    <div className="text-gray-500 text-[10px] mt-1">
                      {new Date(asset.createdAt).toLocaleDateString()} •{' '}
                      {new Date(asset.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { Card } from '@/components/ui/card';
import type { ClientAsset } from '@/lib/types';
import type { StructuredFields } from '@/lib/asset-mapper';

type ClientBriefCardProps = {
  asset: ClientAsset;
  structuredFields?: StructuredFields;
};

export function ClientBriefCard({ asset, structuredFields }: ClientBriefCardProps) {
  const fields = structuredFields || (asset.payload as any)?.structuredFields || {};
  
  const company = fields.company_name || 'Unknown Company';
  const url = fields.website_url || '';
  const industry = fields.industry || 'Not specified';
  const geography = fields.geography || '';
  const services = fields.services || [];
  const targetCustomer = fields.target_customer || '';

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📋</span>
            <h3 className="text-sm font-semibold text-blue-300">
              Client Brief (from Audit)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Company */}
            <div>
              <p className="text-gray-400 mb-1">Company</p>
              <p className="text-gray-100 font-medium">{company}</p>
            </div>

            {/* URL */}
            {url && (
              <div>
                <p className="text-gray-400 mb-1">Website</p>
                <p className="text-gray-100 font-medium truncate">{url}</p>
              </div>
            )}

            {/* Industry */}
            <div>
              <p className="text-gray-400 mb-1">Industry</p>
              <p className="text-gray-100 font-medium">{industry}</p>
            </div>

            {/* Geography */}
            {geography && (
              <div>
                <p className="text-gray-400 mb-1">Geography</p>
                <p className="text-gray-100 font-medium">{geography}</p>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-gray-400 mb-1">Services</p>
                <div className="flex flex-wrap gap-1">
                  {services.slice(0, 3).map((service, i) => (
                    <span
                      key={i}
                      className="inline-block bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-[10px]"
                    >
                      {service}
                    </span>
                  ))}
                  {services.length > 3 && (
                    <span className="text-gray-400 text-[10px] px-2 py-1">
                      +{services.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Target Customer */}
            {targetCustomer && (
              <div className="sm:col-span-2">
                <p className="text-gray-400 mb-1">Target Customer</p>
                <p className="text-gray-100 text-[11px] line-clamp-2">
                  {targetCustomer}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Badge */}
        <div className="flex-shrink-0">
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-green-400 font-semibold">✓ LOADED</p>
          </div>
        </div>
      </div>
    </Card>
  );
}


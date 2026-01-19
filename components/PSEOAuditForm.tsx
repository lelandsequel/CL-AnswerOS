'use client';

import { useState } from 'react';
import Spinner from './Spinner';

interface PSEOAuditFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function PSEOAuditForm({ onSubmit, isLoading = false }: PSEOAuditFormProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    industry: '',
    geography: '',
    services: '',
    target_customer: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const services = formData.services
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    await onSubmit({
      ...formData,
      services,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Company Name *
        </label>
        <input
          type="text"
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="e.g., RockSpring Capital"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Website URL *
        </label>
        <input
          type="url"
          name="website_url"
          value={formData.website_url}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="https://example.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Industry *
          </label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            placeholder="e.g., Commercial Real Estate"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Geography *
          </label>
          <input
            type="text"
            name="geography"
            value={formData.geography}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            placeholder="e.g., United States"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Services (comma-separated) *
        </label>
        <input
          type="text"
          name="services"
          value={formData.services}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="e.g., Bridge Loans, Construction Financing"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Target Customer *
        </label>
        <input
          type="text"
          name="target_customer"
          value={formData.target_customer}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="e.g., Real estate developers and sponsors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="Any additional context..."
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading && <Spinner />}
        {isLoading ? 'Generating...' : 'Generate pSEO Audit'}
      </button>
    </form>
  );
}


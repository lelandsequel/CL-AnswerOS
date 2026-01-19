'use client';

import { useState } from 'react';
import Spinner from './Spinner';

interface DeckOutlineFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function DeckOutlineForm({ onSubmit, isLoading = false }: DeckOutlineFormProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    industry: '',
    current_challenges: '',
    target_outcomes: '',
    budget_range: '',
    timeline: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const challenges = formData.current_challenges
      .split('\n')
      .map(c => c.trim())
      .filter(c => c);

    const outcomes = formData.target_outcomes
      .split('\n')
      .map(o => o.trim())
      .filter(o => o);

    await onSubmit({
      ...formData,
      current_challenges: challenges,
      target_outcomes: outcomes,
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
          placeholder="e.g., Commercial Real Estate Finance"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Current Challenges (one per line) *
        </label>
        <textarea
          name="current_challenges"
          value={formData.current_challenges}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="Limited organic visibility&#10;Missing from AI search results&#10;Inconsistent lead quality"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Target Outcomes (one per line) *
        </label>
        <textarea
          name="target_outcomes"
          value={formData.target_outcomes}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="Rank for 200+ keywords&#10;Appear in AI Overviews&#10;2-3x increase in qualified leads"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Budget Range
          </label>
          <input
            type="text"
            name="budget_range"
            value={formData.budget_range}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            placeholder="e.g., $25K-$50K"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Timeline
          </label>
          <input
            type="text"
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            placeholder="e.g., 90 days"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading && <Spinner />}
        {isLoading ? 'Generating...' : 'Generate Deck Outline'}
      </button>
    </form>
  );
}


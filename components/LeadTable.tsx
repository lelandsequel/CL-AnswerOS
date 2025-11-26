"use client";

import { Lead } from "@/lib/types";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

// Type for raw lead data from DataForSEO
type RawLead = any;

// Normalized lead structure for display
interface NormalizedLead {
  name: string;
  website: string | null;
  location: string | null;
  ratingValue: number | null;
  ratingVotes: number | null;
  seoScore: number | null;
  oppScore: number | null;
  issues: string[];
}

function normalizeLead(raw: RawLead): NormalizedLead {
  const name =
    raw.title ||
    raw.name ||
    raw.business_name ||
    raw.business_title ||
    raw.gmb_name || // DataForSEO sometimes uses this
    raw.location_name ||
    raw.address_info?.business_name ||
    'Unnamed Business';

  const website =
    raw.domain ||
    raw.site ||
    raw.url ||
    raw.place_url ||      // GMB listing URL at least gives you *some* link
    null;

  const location =
    raw.address ||
    raw.address_info?.formatted_address ||
    raw.address_info?.address ||
    raw.city ||
    raw.location ||       // fallback
    null;

  let ratingValue: number | null = null;
  if (typeof raw.rating === 'number') {
    ratingValue = raw.rating;
  } else if (
    raw.rating &&
    typeof raw.rating.value === 'number'
  ) {
    ratingValue = raw.rating.value;
  }

  let ratingVotes: number | null = null;
  if (typeof raw.reviews_count === 'number') {
    ratingVotes = raw.reviews_count;
  } else if (
    raw.rating &&
    typeof raw.rating.votes_count === 'number'
  ) {
    ratingVotes = raw.rating.votes_count;
  }

  const seoScore =
    typeof raw.seo_score === 'number'
      ? raw.seo_score
      : null;

  const oppScore =
    typeof raw.opportunity_score === 'number'
      ? raw.opportunity_score
      : typeof raw.score === 'number'
      ? raw.score
      : null;

  let issues: string[] = [];
  if (Array.isArray(raw.issues)) {
    issues = raw.issues.filter((i: any) => typeof i === 'string');
  } else if (typeof raw.issues === 'string') {
    issues = [raw.issues];
  } else if (typeof raw.score_reason === 'string') {
    issues = [raw.score_reason];
  }

  return {
    name,
    website,
    location,
    ratingValue,
    ratingVotes,
    seoScore,
    oppScore,
    issues,
  };
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  if (!leads?.length) return null;

  const exportCsv = () => {
    const header = [
      "Name",
      "Website",
      "Location",
      "Industry",
      "Phone",
      "Rating",
      "RatingVotes",
      "SEO Score",
      "Opportunity Score",
      "Issues",
    ];
    const rows = leads.map((l) => [
      l.name,
      l.website,
      l.location,
      l.industry,
      l.contactPhone || "",
      l.rating ?? "",
      l.ratingVotes ?? "",
      l.seoScore ?? "",
      l.opportunityScore ?? "",
      (l.issuesSummary || "").replace(/\n/g, " "),
    ]);

    const csv =
      header.join(",") +
      "\n" +
      rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#0A84FF]">
            Lead List
          </h2>
          <p className="text-xs text-gray-400">
            Sorted by DataForSEO rating; enriched with Claude scores.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="text-xs px-3 py-1">
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm text-gray-200">
          <thead className="border-b border-white/10 text-gray-500 uppercase text-[10px]">
            <tr>
              <th className="py-2 pr-3 text-left">Name</th>
              <th className="py-2 pr-3 text-left">Website</th>
              <th className="py-2 pr-3 text-left">Location</th>
              <th className="py-2 pr-3 text-left">Rating</th>
              <th className="py-2 pr-3 text-left">SEO</th>
              <th className="py-2 pr-3 text-left">Opp.</th>
              <th className="py-2 text-left">Issues</th>
              <th className="py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l, i) => {
              const normalized = normalizeLead(l);

              return (
              <tr key={i} className="border-b border-white/5 align-top">
                <td className="py-2 pr-3">
                  <div className="font-semibold">{normalized.name}</div>
                  <div className="text-[10px] text-gray-400">
                    {l.industry || l.rawCategory || '—'}
                  </div>
                </td>
                <td className="py-2 pr-3">
                  {normalized.website ? (
                    <a
                      href={normalized.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0A84FF] hover:underline break-all"
                    >
                      {normalized.website}
                    </a>
                  ) : (
                    <span className="text-gray-500">No site listed</span>
                  )}
                  {l.contactPhone && (
                    <div className="text-[10px] text-gray-400">
                      {l.contactPhone}
                    </div>
                  )}
                </td>
                <td className="py-2 pr-3 text-gray-300">
                  {normalized.location || "—"}
                </td>
                <td className="py-2 pr-3 text-gray-300">
                  {normalized.ratingValue !== null
                    ? `${normalized.ratingValue.toFixed(1)}/5${
                        normalized.ratingVotes !== null ? ` (${normalized.ratingVotes})` : ''
                      }`
                    : '—'}
                </td>
                <td className="py-2 pr-3">
                  {normalized.seoScore !== null
                    ? `${normalized.seoScore}/100`
                    : "—"}
                </td>
                <td className="py-2 pr-3">
                  {normalized.oppScore !== null
                    ? `${normalized.oppScore}/100`
                    : "—"}
                </td>
                <td className="py-2 text-gray-300 whitespace-pre-wrap max-w-xs">
                  {normalized.issues.length > 0
                    ? normalized.issues.join('; ')
                    : '—'}
                </td>
                <td className="py-2 text-right">
                  <Button
                    className="h-7 text-xs bg-[#0A84FF] hover:bg-[#0066CC] px-2"
                    onClick={() => {
                      // Navigate to audit page with pre-filled URL
                      if (normalized.website) {
                        window.location.href = `/audit?url=${encodeURIComponent(normalized.website)}`;
                      } else {
                        alert("No website available to audit");
                      }
                    }}
                  >
                    Run Audit
                  </Button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}


"use client";
import { Card } from "@/components/ui/card";
import { SavedAuditsList } from "@/components/SavedAuditsList";

export default function SavedPage() {
  return (
    <div className="space-y-8">
      <Card>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF] mb-2">
          Saved Audits
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          All your audits, stored in Supabase. Click any to re-run or export.
        </p>
      </Card>

      <SavedAuditsList />
    </div>
  );
}


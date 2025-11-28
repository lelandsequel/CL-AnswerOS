"use client";
import { Card } from "@/components/ui/card";
import { SavedAuditsList } from "@/components/SavedAuditsList";

export default function AuditHistoryPage() {
  return (
    <div className="space-y-8">
      <Card>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF] mb-2">
          Audit History
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          All your completed audits. Click any to view details or export a report.
        </p>
      </Card>

      <SavedAuditsList />
    </div>
  );
}


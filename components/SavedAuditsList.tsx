"use client";
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { fetchAudits } from "@/lib/auditStore";
import { AuditRecord } from "@/lib/types";
import Spinner from "./Spinner";

export function SavedAuditsList() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchAudits();
      setAudits(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  if (!audits.length)
    return (
      <Card>
        <div className="text-sm text-gray-400">
          No audits saved yet. Run an audit and it will appear here.
        </div>
      </Card>
    );

  return (
    <div className="space-y-4">
      {audits.map((a) => (
        <Card key={a.id} className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="font-semibold text-[#0A84FF] truncate">
              {a.url}
            </div>
            <div className="text-gray-500 text-xs">
              {new Date(a.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="flex gap-3 text-xs text-gray-400">
          </div>
        </Card>
      ))}
    </div>
  );
}


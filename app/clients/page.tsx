// app/clients/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { Client, ClientStage, AuditRecord } from "@/lib/types";

type StageFilter = ClientStage | "all";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    null
  );
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");

  // New client form
  const [name, setName] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState<ClientStage>("lead");

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadAudits(selectedClient.id);
    } else {
      setAudits([]);
    }
  }, [selectedClient]);

  async function loadClients() {
    try {
      setLoadingClients(true);
      setError("");
      const res = await fetch("/api/clients");
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to fetch clients");
      const data = JSON.parse(text);
      setClients(data.clients || []);
      if (!selectedClient && data.clients?.length) {
        setSelectedClient(data.clients[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadAudits(clientId: string) {
    try {
      setLoadingAudits(true);
      setError("");
      const res = await fetch(`/api/clients/${clientId}/audits`);
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to fetch audits");
      const data = JSON.parse(text);
      setAudits(data.audits || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load audits");
    } finally {
      setLoadingAudits(false);
    }
  }

  async function createClient() {
    try {
      setCreating(true);
      setError("");
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          primaryDomain: primaryDomain || undefined,
          contactName: contactName || undefined,
          contactEmail: contactEmail || undefined,
          notes: notes || undefined,
          stage,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to create client");
      const data = JSON.parse(text);
      const newClient: Client = data.client;
      setClients((prev) => [newClient, ...prev]);
      setSelectedClient(newClient);
      setName("");
      setPrimaryDomain("");
      setContactName("");
      setContactEmail("");
      setNotes("");
      setStage("lead");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create client");
    } finally {
      setCreating(false);
    }
  }

  const filteredClients =
    stageFilter === "all"
      ? clients
      : clients.filter((c) => c.stage === stageFilter);

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF]">
              Clients
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Attach audits, content, and leads to real clients so you&apos;re
              operating a book of business, not a pile of PDFs.
            </p>
          </div>
          <div className="flex gap-2 text-[11px] text-gray-400">
            <span>Filter:</span>
            <select
              value={stageFilter}
              onChange={(e) =>
                setStageFilter(e.target.value as StageFilter)
              }
              className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-xs"
            >
              <option value="all">All</option>
              <option value="lead">Leads</option>
              <option value="active">Active</option>
              <option value="past">Past</option>
              <option value="internal">Internal</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)]">
          {/* Left: client list & create */}
          <div className="space-y-4">
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-300">
                  Clients ({filteredClients.length})
                </div>
                {loadingClients && (
                  <span className="text-[10px] text-gray-500">
                    Loading…
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {filteredClients.length === 0 && (
                  <div className="px-3 py-4 text-xs text-gray-500">
                    No clients yet. Create one below.
                  </div>
                )}
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClient(c)}
                    className={`w-full text-left px-3 py-2 border-b border-white/5 text-xs hover:bg-white/5 transition ${
                      selectedClient?.id === c.id
                        ? "bg-[#0A84FF]/20"
                        : ""
                    }`}
                  >
                    <div className="font-semibold text-gray-100">
                      {c.name}
                    </div>
                    {c.primaryDomain && (
                      <div className="text-[11px] text-gray-400">
                        {c.primaryDomain}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-500">
                      Stage: {c.stage}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-white/10 rounded-xl p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-300 mb-1">
                New Client
              </div>
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Client name (required)"
                className="text-xs"
              />
              <Input
                value={primaryDomain}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrimaryDomain(e.target.value)}
                placeholder="Primary domain (optional)"
                className="text-xs"
              />
              <Input
                value={contactName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactName(e.target.value)}
                placeholder="Contact name (optional)"
                className="text-xs"
              />
              <Input
                value={contactEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactEmail(e.target.value)}
                placeholder="Contact email (optional)"
                className="text-xs"
              />
              <Textarea
                rows={3}
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="Notes, context, deals, etc."
                className="text-xs"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={stage}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStage(e.target.value as ClientStage)
                  }
                  className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-gray-200"
                >
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="past">Past</option>
                  <option value="internal">Internal</option>
                </select>
                <Button
                  disabled={creating || !name.trim()}
                  onClick={createClient}
                >
                  {creating ? "Creating…" : "Create Client"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-[11px] text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2 whitespace-pre-wrap">
                {error}
              </div>
            )}
          </div>

          {/* Right: selected client detail + audits */}
          <div className="space-y-4">
            <Card>
              {selectedClient ? (
                <div className="space-y-2 text-xs sm:text-sm text-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-100">
                        {selectedClient.name}
                      </div>
                      {selectedClient.primaryDomain && (
                        <div className="text-[11px] text-gray-400">
                          {selectedClient.primaryDomain}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200">
                      Stage: {selectedClient.stage}
                    </div>
                  </div>
                  {selectedClient.contactName && (
                    <div className="text-[11px] text-gray-400">
                      Contact:{" "}
                      <span className="text-gray-200">
                        {selectedClient.contactName}
                      </span>{" "}
                      {selectedClient.contactEmail && (
                        <>
                          ·{" "}
                          <span className="text-gray-200">
                            {selectedClient.contactEmail}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {selectedClient.notes && (
                    <div className="text-[11px] text-gray-300 whitespace-pre-wrap mt-2">
                      {selectedClient.notes}
                    </div>
                  )}
                  <div className="pt-2">
                    <Link
                      href={`/clients/${selectedClient.id}/assets`}
                      className="text-xs text-[#0A84FF] hover:underline"
                    >
                      View Client Assets →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Select a client to see their audits.
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs font-semibold text-gray-300">
                    Audits
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Most recent audits attached to this client.
                  </div>
                </div>
                {loadingAudits && (
                  <span className="text-[10px] text-gray-500">
                    Loading…
                  </span>
                )}
              </div>
              {!selectedClient && (
                <div className="text-xs text-gray-500">
                  No client selected.
                </div>
              )}
              {selectedClient && audits.length === 0 && (
                <div className="text-xs text-gray-500">
                  No audits attached yet. When you run audits, we&apos;ll add a
                  client assignment path next so they show up here.
                </div>
              )}
              {selectedClient && audits.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
                  {audits.map((a) => (
                    <div
                      key={a.id}
                      className="border border-white/10 rounded-lg p-2"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-semibold text-gray-100 truncate">
                          {a.domain}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(a.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        {a.url}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-300 whitespace-pre-wrap line-clamp-3">
                        {a.summary}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                        <div>
                          {a.opportunityRating && (
                            <span>
                              Opportunity: {a.opportunityRating}
                            </span>
                          )}
                        </div>
                        {a.rawScore != null && (
                          <div>Score: {a.rawScore.toFixed(1)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </Card>

      {(loadingClients || loadingAudits) && <Spinner />}
    </div>
  );
}


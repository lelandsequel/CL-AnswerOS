"use client";

import { PressReleaseResponse } from "@/lib/types";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

export function PressReleasePreview({ data }: { data: PressReleaseResponse }) {
  if (!data) return null;

  const fullText = [
    `HEADLINE: ${data.headline}`,
    `SUBHEAD: ${data.subheadline}`,
    "",
    ...data.sections.map((s) => `${s.title.toUpperCase()}\n${s.content}\n`),
    "BOILERPLATE",
    data.boilerplate,
  ].join("\n");

  function copyFull() {
    navigator.clipboard.writeText(fullText).catch(console.error);
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold text-[#0A84FF]">
          Press Release Draft
        </h2>
        <Button variant="outline" onClick={copyFull} className="text-xs">
          Copy Full Release
        </Button>
      </div>

      <div className="space-y-4 text-xs sm:text-sm text-gray-200">
        <div>
          <div className="text-xl sm:text-2xl font-bold mb-1">
            {data.headline}
          </div>
          <div className="text-sm text-gray-300">{data.subheadline}</div>
        </div>

        {data.sections.map((s, idx) => (
          <section key={idx}>
            <h3 className="font-semibold text-blue-300 mb-1">{s.title}</h3>
            <p className="whitespace-pre-wrap text-gray-200">
              {s.content}
            </p>
          </section>
        ))}

        <section>
          <h3 className="font-semibold text-blue-300 mb-1">
            Boilerplate
          </h3>
          <p className="whitespace-pre-wrap text-gray-200">
            {data.boilerplate}
          </p>
        </section>

        {data.quotes?.length > 0 && (
          <section>
            <h3 className="font-semibold text-blue-300 mb-1">Quotes</h3>
            <ul className="list-disc list-inside space-y-1">
              {data.quotes.map((q, i) => (
                <li key={i} className="italic">
                  "{q}"
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.socialSnippets?.length > 0 && (
          <section>
            <h3 className="font-semibold text-blue-300 mb-1">
              Social Snippets
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-200">
              {data.socialSnippets.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Card>
  );
}


"use client";

import {
  ArticleContent,
  ContentGenerationResult,
  LandingPageContent,
  PressReleaseContent,
  SocialPackContent,
} from "@/lib/types";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useState } from "react";
import { SaveAssetButton } from "./assets/SaveAssetButton";

interface Props {
  result: ContentGenerationResult | null;
  clientId?: string | null;
}

export function ContentResultPanel({ result, clientId }: Props) {
  const [copied, setCopied] = useState("");

  if (!result) return null;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch (e) {
      console.error(e);
    }
  }

  const renderPress = (data: PressReleaseContent) => {
    const fullText = [
      data.headline,
      data.subheadline,
      "",
      ...data.sections.map(
        (s) => `${s.title.toUpperCase()}\n${s.content}\n`
      ),
      "BOILERPLATE",
      data.boilerplate,
    ].join("\n");

    return (
      <div className="space-y-4 text-xs sm:text-sm text-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-blue-300">
              Press Release Draft
            </h2>
            <p className="text-[11px] text-gray-400">
              Full text + boilerplate + quotes + social snippets
            </p>
          </div>
          <div className="flex gap-2">
            <SaveAssetButton
              type="press_release"
              title={data.headline}
              summary={data.subheadline}
              payload={data}
              tags={["press_release", "content"]}
              clientId={clientId}
              label="Save to Client"
              className="text-xs"
            />
            <Button
              variant="outline"
              onClick={() => copy(fullText, "press")}
              className="text-xs"
            >
              {copied === "press" ? "Copied" : "Copy Full Release"}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-bold mb-1">
            {data.headline}
          </h3>
          <p className="text-sm text-gray-300">{data.subheadline}</p>
        </div>

        {data.sections.map((s, i) => (
          <section key={i} className="space-y-1">
            <h4 className="font-semibold text-blue-300">
              {s.title}
            </h4>
            <p className="whitespace-pre-wrap">{s.content}</p>
          </section>
        ))}

        <section>
          <h4 className="font-semibold text-blue-300 mb-1">
            Boilerplate
          </h4>
          <p className="whitespace-pre-wrap">{data.boilerplate}</p>
        </section>

        {!!data.quotes?.length && (
          <section>
            <h4 className="font-semibold text-blue-300 mb-1">Quotes</h4>
            <ul className="list-disc list-inside space-y-1">
              {data.quotes.map((q, i) => (
                <li key={i} className="italic">
                  &quot;{q}&quot;
                </li>
              ))}
            </ul>
          </section>
        )}

        {!!data.socialSnippets?.length && (
          <section>
            <h4 className="font-semibold text-blue-300 mb-1">
              Social Snippets
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {data.socialSnippets.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  };

  const renderArticle = (data: ArticleContent) => {
    const fullArticle = [
      data.title,
      data.subtitle,
      "",
      ...data.outline.map(
        (sec) => `${sec.heading}\n${sec.body}\n`
      ),
      "",
      "FAQs:",
      ...data.faqs.map(
        (f) => `Q: ${f.question}\nA: ${f.answer}\n`
      ),
    ].join("\n");

    const metaBlock = `Title: ${data.metaTitle}\nDescription: ${data.metaDescription}`;

    return (
      <div className="space-y-4 text-xs sm:text-sm text-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-blue-300">
              SEO Article Draft
            </h2>
            <p className="text-[11px] text-gray-400">
              Outline, draft, FAQs, and meta tags
            </p>
          </div>
          <div className="flex gap-2">
            <SaveAssetButton
              type="article"
              title={data.title}
              summary={data.subtitle}
              payload={data}
              tags={["article", "seo", "content"]}
              clientId={clientId}
              label="Save to Client"
              className="text-xs"
            />
            <Button
              variant="outline"
              onClick={() => copy(fullArticle, "article")}
              className="text-xs"
            >
              {copied === "article" ? "Copied" : "Copy Article"}
            </Button>
            <Button
              variant="outline"
              onClick={() => copy(metaBlock, "meta")}
              className="text-xs"
            >
              {copied === "meta" ? "Copied" : "Copy Meta Tags"}
            </Button>
          </div>
        </div>

        <section>
          <h3 className="text-xl sm:text-2xl font-bold mb-1">
            {data.title}
          </h3>
          <p className="text-sm text-gray-300">{data.subtitle}</p>
          <p className="mt-2 text-[11px] text-gray-500">
            Target word count: {data.wordCountTarget} · Primary keyword:{" "}
            <span className="font-mono">{data.primaryKeyword}</span>
          </p>
        </section>

        <section className="space-y-3">
          {data.outline.map((sec, i) => (
            <div key={i}>
              <h4 className="font-semibold text-blue-300 mb-1">
                {sec.heading}
              </h4>
              <p className="whitespace-pre-wrap">{sec.body}</p>
            </div>
          ))}
        </section>

        {!!data.faqs?.length && (
          <section className="space-y-2">
            <h4 className="font-semibold text-blue-300">
              FAQs
            </h4>
            {data.faqs.map((f, i) => (
              <div key={i}>
                <p className="font-semibold">Q: {f.question}</p>
                <p className="whitespace-pre-wrap">
                  A: {f.answer}
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-1 text-[11px] text-gray-400 border-t border-white/10 pt-3">
          <div className="font-semibold text-gray-300">
            Meta Title
          </div>
          <div className="whitespace-pre-wrap">
            {data.metaTitle}
          </div>
          <div className="font-semibold text-gray-300 mt-2">
            Meta Description
          </div>
          <div className="whitespace-pre-wrap">
            {data.metaDescription}
          </div>
        </section>
      </div>
    );
  };

  const renderLanding = (data: LandingPageContent) => {
    const fullLanding = [
      data.heroHeadline,
      data.heroSubheadline,
      "",
      "Primary CTA: " + data.primaryCTA,
      data.secondaryCTA
        ? "Secondary CTA: " + data.secondaryCTA
        : "",
      "",
      "Value props:",
      ...data.valueProps.map(
        (v) => `${v.title}\n${v.body}\n`
      ),
      "",
      "Sections:",
      ...data.sectionBlocks.map(
        (s) => `${s.title}\n${s.content}\n`
      ),
    ].join("\n");

    return (
      <div className="space-y-4 text-xs sm:text-sm text-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-blue-300">
              Landing Page Copy
            </h2>
            <p className="text-[11px] text-gray-400">
              Hero, value props, CTAs, and core sections
            </p>
          </div>
          <div className="flex gap-2">
            <SaveAssetButton
              type="landing_page"
              title={data.heroHeadline}
              summary={data.heroSubheadline}
              payload={data}
              tags={["landing_page", "content"]}
              clientId={clientId}
              label="Save to Client"
              className="text-xs"
            />
            <Button
              variant="outline"
              onClick={() => copy(fullLanding, "landing")}
              className="text-xs"
            >
              {copied === "landing" ? "Copied" : "Copy Page Copy"}
            </Button>
          </div>
        </div>

        <section className="bg-black/40 rounded-xl p-4 border border-white/10 space-y-1">
          <div className="text-sm font-semibold text-blue-200">
            Hero
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">
            {data.heroHeadline}
          </h3>
          <p className="text-sm text-gray-300">
            {data.heroSubheadline}
          </p>
          <div className="mt-2 text-xs text-gray-400">
            Primary CTA:{" "}
            <span className="font-semibold text-gray-200">
              {data.primaryCTA}
            </span>
            {data.secondaryCTA && (
              <>
                {" · "}Secondary CTA:{" "}
                <span className="font-semibold text-gray-200">
                  {data.secondaryCTA}
                </span>
              </>
            )}
          </div>
        </section>

        {!!data.valueProps?.length && (
          <section className="space-y-2">
            <h4 className="font-semibold text-blue-300">
              Value Props
            </h4>
            <div className="grid md:grid-cols-3 gap-3">
              {data.valueProps.map((v, i) => (
                <div
                  key={i}
                  className="bg-black/30 rounded-xl p-3 border border-white/10"
                >
                  <div className="font-semibold text-gray-100 mb-1">
                    {v.title}
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!!data.sectionBlocks?.length && (
          <section className="space-y-3">
            <h4 className="font-semibold text-blue-300">
              Sections
            </h4>
            {data.sectionBlocks.map((s, i) => (
              <div key={i}>
                <div className="font-semibold text-gray-100 mb-1">
                  {s.title}
                </div>
                <p className="whitespace-pre-wrap">{s.content}</p>
              </div>
            ))}
          </section>
        )}

        {!!data.proofElements?.length && (
          <section className="space-y-1 text-[11px] text-gray-400 border-t border-white/10 pt-3">
            <div className="font-semibold text-gray-300">
              Proof Ideas
            </div>
            <ul className="list-disc list-inside">
              {data.proofElements.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  };

  const renderSocial = (data: SocialPackContent) => {
    const allSocial = [
      "LINKEDIN POST:",
      data.linkedinPost,
      "",
      "TWITTER THREAD:",
      data.twitterThread,
      "",
      "EMAIL TEASER:",
      data.emailTeaser,
      "",
      "BULLETS:",
      ...data.bullets.map((b) => "- " + b),
    ].join("\n");

    return (
      <div className="space-y-4 text-xs sm:text-sm text-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-blue-300">
              Social Pack
            </h2>
            <p className="text-[11px] text-gray-400">
              LinkedIn, X thread, email, and bullets
            </p>
          </div>
          <div className="flex gap-2">
            <SaveAssetButton
              type="social_pack"
              title="Social Media Pack"
              summary={data.linkedinPost.slice(0, 100) + "..."}
              payload={data}
              tags={["social", "content"]}
              clientId={clientId}
              label="Save to Client"
              className="text-xs"
            />
            <Button
              variant="outline"
              onClick={() => copy(allSocial, "social")}
              className="text-xs"
            >
              {copied === "social" ? "Copied" : "Copy All"}
            </Button>
          </div>
        </div>

        <section className="space-y-2">
          <h3 className="font-semibold text-blue-300">
            LinkedIn Post
          </h3>
          <p className="whitespace-pre-wrap">{data.linkedinPost}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-blue-300">
            X / Twitter Thread
          </h3>
          <p className="whitespace-pre-wrap">{data.twitterThread}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-blue-300">
            Email Teaser
          </h3>
          <p className="whitespace-pre-wrap">{data.emailTeaser}</p>
        </section>

        {!!data.bullets?.length && (
          <section className="space-y-2">
            <h3 className="font-semibold text-blue-300">
              Bullets / Callouts
            </h3>
            <ul className="list-disc list-inside">
              {data.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  };

  return (
    <Card className="mt-4">
      {result.type === "press_release" && renderPress(result)}
      {result.type === "article" && renderArticle(result)}
      {result.type === "landing" && renderLanding(result)}
      {result.type === "social" && renderSocial(result)}
    </Card>
  );
}


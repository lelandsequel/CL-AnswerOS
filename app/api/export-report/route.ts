// app/api/export-report/route.ts
// Exports audit + operator report as downloadable text or markdown file

import { NextRequest, NextResponse } from "next/server";
import { generateTextReport, generateMarkdownReport, ReportData } from "@/lib/reportGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const {
      url,
      domain,
      clientName,
      rawScore,
      opportunityRating,
      structuredAudit,
      operatorReport,
      format = "txt", // "txt" or "md"
    } = body;

    if (!url || !domain) {
      return NextResponse.json(
        { error: "url and domain are required" },
        { status: 400 }
      );
    }

    const reportData: ReportData = {
      url,
      domain,
      clientName,
      rawScore,
      opportunityRating,
      structuredAudit,
      operatorReport,
      createdAt: new Date().toISOString(),
    };

    let content: string;
    let filename: string;
    let contentType: string;

    if (format === "md") {
      content = generateMarkdownReport(reportData);
      filename = `audit-report-${domain.replace(/\./g, "-")}-${Date.now()}.md`;
      contentType = "text/markdown";
    } else {
      content = generateTextReport(reportData);
      filename = `audit-report-${domain.replace(/\./g, "-")}-${Date.now()}.txt`;
      contentType = "text/plain";
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("[export-report] error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to export report" },
      { status: 500 }
    );
  }
}


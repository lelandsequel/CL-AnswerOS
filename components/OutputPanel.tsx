'use client';

import { useState } from 'react';
import { Copy, Download } from 'lucide-react';

interface OutputPanelProps {
  title: string;
  content: string;
  filename?: string;
}

export function OutputPanel({ title, content, filename }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = filename || 'output.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition-colors"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/30 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-lg bg-slate-950 p-4">
        <pre className="whitespace-pre-wrap break-words text-xs text-slate-300 font-mono">
          {content}
        </pre>
      </div>
    </div>
  );
}


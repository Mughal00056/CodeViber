import React from 'react';
import { Globe, FileCode, Palette, Image as ImageIcon, Code2 } from 'lucide-react';
import type { ExtractionResult } from '../types.ts';

interface StatsBarProps {
  extraction: ExtractionResult;
  onOpenDownload: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const StatsBar: React.FC<StatsBarProps> = ({ extraction, onOpenDownload }) => {
  const { meta, stats, domain, url } = extraction;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Site Details */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <Globe className="w-3.5 h-3.5" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline truncate"
            >
              {url}
            </a>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white truncate">
            {meta.title || domain}
          </h2>

          {meta.description && (
            <p className="text-xs text-slate-400 line-clamp-1">
              {meta.description}
            </p>
          )}

          {/* Clean Unboxed Metadata with Typographic Separators (Zero-Pill Compliance) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="font-medium text-slate-300">{domain}</span>
            <span aria-hidden="true">·</span>
            <span>HTML {formatBytes(stats.htmlLength)}</span>
            <span aria-hidden="true">·</span>
            <span>CSS {formatBytes(stats.cssLength)}</span>
            <span aria-hidden="true">·</span>
            <span>{stats.imageCount} Images</span>
            <span aria-hidden="true">·</span>
            <span>{stats.svgCount} SVGs</span>
            <span aria-hidden="true">·</span>
            <span>Next.js 15 & React 19 Ready</span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenDownload}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <span>Download Project ZIP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

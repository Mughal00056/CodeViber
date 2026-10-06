import React from 'react';
import { Download, Sparkles, Terminal } from 'lucide-react';

interface HeaderProps {
  onOpenDownload?: () => void;
  hasExtractedData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDownload, hasExtractedData }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                WebExtractor
              </span>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
                React · Next.js · ZIP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Website URL se poora source code nikalein & ZIP download karein
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {hasExtractedData && (
            <button
              onClick={onOpenDownload}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Download</span> ZIP
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <span>Mobile Ready</span>
            <span aria-hidden="true">·</span>
            <span>Next.js 15</span>
            <span aria-hidden="true">·</span>
            <span>React 19</span>
          </div>
        </div>
      </div>
    </header>
  );
};

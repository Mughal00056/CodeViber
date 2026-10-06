import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { UrlInputBar } from './components/UrlInputBar.tsx';
import { StatsBar } from './components/StatsBar.tsx';
import { ProjectExplorer } from './components/ProjectExplorer.tsx';
import { DownloadModal } from './components/DownloadModal.tsx';
import type { ExtractionResult } from './types.ts';
import {
  Download,
  Code2,
  Sparkles,
  Smartphone,
  Layers,
  FileArchive,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function App() {
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const handleExtract = async (
    url: string,
    rawHtmlInput?: string,
    extractExternalCss: boolean = true
  ) => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Connecting to website & resolving DOM...');

    try {
      // Step simulation for friendly UX feedback
      const stepTimer1 = setTimeout(() => {
        setLoadingStep('Extracting HTML, CSS stylesheets, and scripts...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Converting to React 19 & Next.js 15 App Router components...');
      }, 2500);

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          rawHtmlInput,
          extractExternalCss,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract website');
      }

      setExtraction(data);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(
        err?.message ||
          'Could not scrape this URL. The website might be protected or unreachable. You can also paste raw HTML directly using "Direct HTML Paste".'
      );
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleRefactorWithAi = async (
    code: string,
    target: 'react' | 'nextjs',
    fileName: string
  ): Promise<string | null> => {
    try {
      const res = await fetch('/api/ai-refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          target,
          componentName: fileName.replace(/[^a-zA-Z0-9]/g, ''),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'AI Refactoring failed');
        return null;
      }

      const data = await res.json();
      return data.code;
    } catch (err: any) {
      alert(err.message || 'AI request failed');
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        onOpenDownload={() => setIsDownloadModalOpen(true)}
        hasExtractedData={Boolean(extraction)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Banner / Instructions */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Website Source Code to React, Next.js & ZIP</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Website URL Se Full Code Nikalein &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
              ZIP Download Karein
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Kisi bhi website ka link daliye aur instant <strong>Next.js 15</strong>,{' '}
            <strong>React 19 + Vite</strong>, aur clean <strong>HTML5/CSS</strong> source code
            ek click mein poora ZIP download karein — mobile aur desktop dono ke liye!
          </p>
        </div>

        {/* Input Bar */}
        <UrlInputBar
          onExtract={handleExtract}
          isLoading={isLoading}
          loadingStep={loadingStep}
        />

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-200">Extraction Error</p>
              <p className="text-xs text-rose-300/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Extracted Content or Welcome Features */}
        {extraction ? (
          <div className="space-y-6 animate-in fade-in duration-300 pb-16">
            <StatsBar
              extraction={extraction}
              onOpenDownload={() => setIsDownloadModalOpen(true)}
            />

            <ProjectExplorer
              extraction={extraction}
              onOpenDownload={() => setIsDownloadModalOpen(true)}
              onRefactorWithAi={handleRefactorWithAi}
            />
          </div>
        ) : (
          /* Empty State / Feature Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">Next.js 15 App Router</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Automatic component decomposition (`app/page.tsx`, `components/Navbar.tsx`, `Hero.tsx`, `Footer.tsx`) with modern TypeScript & Tailwind CSS.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">React 19 + Vite Project</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ready-to-run SPA setup with `vite.config.ts`, `package.json`, and clean modular JSX components.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">One-Click Mobile ZIP</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Mobile browser se hi poori website ka code single-tap mein `.zip` file format mein save karein. Direct extract karke use karein.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Floating Download Action Bar (when project extracted) */}
      {extraction && (
        <div className="fixed bottom-0 inset-x-0 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-30 sm:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="flex-1 h-12 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download Project ZIP</span>
            </button>
          </div>
        </div>
      )}

      {/* Download Modal Dialog */}
      {extraction && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          extraction={extraction}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} WebExtractor Studio · Next.js, React & HTML Source Scraper</p>
          <div className="flex items-center gap-3">
            <span>Mobile-First Engine</span>
            <span aria-hidden="true">·</span>
            <span>Client-Side ZIP Archiver</span>
            <span aria-hidden="true">·</span>
            <span>Gemini AI Refactor</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { Search, Globe, Clipboard, Loader2, Sparkles, Code2, ArrowRight } from 'lucide-react';

interface UrlInputBarProps {
  onExtract: (url: string, rawHtmlInput?: string, extractExternalCss?: boolean) => void;
  isLoading: boolean;
  loadingStep: string;
}

const PRESET_SITES = [
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com' },
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/React_(software)' },
  { name: 'Example.com', url: 'https://example.com' },
];

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  onExtract,
  isLoading,
  loadingStep,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'url' | 'rawHtml'>('url');
  const [rawHtmlText, setRawHtmlText] = useState('');
  const [extractExternalCss, setExtractExternalCss] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'url') {
      if (!inputUrl.trim()) return;
      onExtract(inputUrl.trim(), undefined, extractExternalCss);
    } else {
      if (!rawHtmlText.trim()) return;
      onExtract(inputUrl.trim() || 'https://pasted-markup.local', rawHtmlText, extractExternalCss);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (activeTab === 'url') {
        setInputUrl(text.trim());
      } else {
        setRawHtmlText(text);
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
  };

  const handleSelectPreset = (url: string) => {
    setInputUrl(url);
    onExtract(url, undefined, extractExternalCss);
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Website URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rawHtml')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'rawHtml'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Direct HTML Paste</span>
          </button>
        </div>

        <label className="hidden sm:flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={extractExternalCss}
            onChange={(e) => setExtractExternalCss(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
          />
          <span>Include External CSS</span>
        </label>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'url' ? (
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Website URL likhein (e.g. tailwindcss.com ya https://site.com)"
                disabled={isLoading}
                className="w-full h-13 pl-11 pr-24 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button
                type="button"
                onClick={handlePaste}
                disabled={isLoading}
                className="absolute inset-y-1.5 right-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Paste</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="h-13 px-6 rounded-xl font-bold text-sm sm:text-base bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-98 transition-all shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <span>Extract Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={rawHtmlText}
                onChange={(e) => setRawHtmlText(e.target.value)}
                placeholder="Paste your raw HTML source code here (agar website cloudflare ya captcha protect ho to view-source paste karein)..."
                disabled={isLoading}
                rows={5}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-200 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button
                type="button"
                onClick={handlePaste}
                disabled={isLoading}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste Code</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !rawHtmlText.trim()}
              className="w-full h-12 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting Markup...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Convert HTML to React & Next.js Project</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Live Step Progress when loading */}
        {isLoading && (
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center gap-3 text-xs sm:text-sm text-indigo-300 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{loadingStep || 'Processing website markup...'}</p>
              <p className="text-[11px] text-indigo-400/80">
                HTML, CSS, assets extract ho rahe hain aur React/Next.js bundle ban rahi hai
              </p>
            </div>
          </div>
        )}

        {/* Preset quick test chips */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Test:</span>
          {PRESET_SITES.map((site) => (
            <button
              key={site.name}
              type="button"
              onClick={() => handleSelectPreset(site.url)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
            >
              {site.name}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Folder,
  Copy,
  Check,
  Download,
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { ExtractionResult, ProjectFormat } from '../types.ts';

interface ProjectExplorerProps {
  extraction: ExtractionResult;
  onOpenDownload: () => void;
  onRefactorWithAi: (code: string, target: 'react' | 'nextjs', fileName: string) => Promise<string | null>;
}

type ExplorerTab = 'nextjs' | 'react' | 'html5' | 'assets' | 'preview';

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  extraction,
  onOpenDownload,
  onRefactorWithAi,
}) => {
  const [currentTab, setCurrentTab] = useState<ExplorerTab>('nextjs');
  const [copiedFile, setCopiedFile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAiRefactoring, setIsAiRefactoring] = useState(false);
  const [aiCustomCode, setAiCustomCode] = useState<Record<string, string>>({});

  // Active files mapping based on currentTab
  const currentFiles = useMemo(() => {
    if (currentTab === 'nextjs') return extraction.projects.nextjs;
    if (currentTab === 'react') return extraction.projects.react;
    if (currentTab === 'html5') return extraction.projects.html5;
    return {};
  }, [currentTab, extraction]);

  const fileKeys = useMemo(() => Object.keys(currentFiles), [currentFiles]);

  const [selectedFile, setSelectedFile] = useState<string>(() => {
    return fileKeys[0] || 'app/page.tsx';
  });

  // Keep selected file in sync when switching tabs
  const activeFileName = useMemo(() => {
    if (fileKeys.includes(selectedFile)) return selectedFile;
    return fileKeys[0] || '';
  }, [fileKeys, selectedFile]);

  // Code content (including any AI refactored version)
  const activeCodeContent = useMemo(() => {
    const key = `${currentTab}:${activeFileName}`;
    if (aiCustomCode[key]) return aiCustomCode[key];
    return currentFiles[activeFileName] || '// No content';
  }, [aiCustomCode, currentTab, activeFileName, currentFiles]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeCodeContent);
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([activeCodeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFileName.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTriggerAiRefactor = async () => {
    if (!activeCodeContent || isAiRefactoring) return;
    setIsAiRefactoring(true);
    try {
      const framework = currentTab === 'nextjs' ? 'nextjs' : 'react';
      const refactored = await onRefactorWithAi(activeCodeContent, framework, activeFileName);
      if (refactored) {
        const key = `${currentTab}:${activeFileName}`;
        setAiCustomCode((prev) => ({ ...prev, [key]: refactored }));
      }
    } finally {
      setIsAiRefactoring(false);
    }
  };

  const codeLines = useMemo(() => activeCodeContent.split('\n'), [activeCodeContent]);

  return (
    <div
      className={`w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 p-4' : ''
      }`}
    >
      {/* Top Header & Framework Navigation */}
      <div className="bg-slate-950/80 border-b border-slate-800 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Framework Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setCurrentTab('nextjs')}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              currentTab === 'nextjs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>⚡ Next.js 15 App</span>
          </button>

          <button
            onClick={() => setCurrentTab('react')}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              currentTab === 'react'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>⚛️ React + Vite</span>
          </button>

          <button
            onClick={() => setCurrentTab('html5')}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              currentTab === 'html5'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>🌐 HTML5 & CSS</span>
          </button>

          <button
            onClick={() => setCurrentTab('assets')}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              currentTab === 'assets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>🖼️ Assets ({extraction.assets.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('preview')}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              currentTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onOpenDownload}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Explorer Body: Split into File Tree and Code/Preview View */}
      {currentTab === 'preview' ? (
        <div className="p-4 bg-slate-950 flex flex-col gap-3 min-h-[500px]">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Sandboxed View of Extracted Web Markup</span>
            <a
              href={extraction.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:underline"
            >
              <span>Visit Original</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-800 bg-white">
            <iframe
              title="Live Extracted Preview"
              srcDoc={extraction.rawHtml}
              sandbox="allow-scripts"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      ) : currentTab === 'assets' ? (
        <div className="p-4 sm:p-6 bg-slate-950 min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Extracted Assets & Media ({extraction.assets.length})
            </h3>
            <span className="text-xs text-slate-400">
              Images, SVGs, and linked resources
            </span>
          </div>

          {extraction.assets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No standalone media assets detected on this page.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {extraction.assets.map((asset, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {asset.type === 'image' && asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-8 h-8 rounded object-cover bg-slate-800 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                        {asset.type.toUpperCase().slice(0, 3)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 truncate">{asset.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{asset.type}</p>
                    </div>
                  </div>

                  {asset.url && (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0"
                      title="Open Asset"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px] divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* File Explorer Sidebar / Mobile Horizontal Selector */}
          <div className="lg:col-span-3 bg-slate-950 p-3 sm:p-4 overflow-y-auto max-h-[220px] lg:max-h-[650px]">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2.5 px-1">
              <span>PROJECT FILES</span>
              <span>{fileKeys.length} files</span>
            </div>

            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {fileKeys.map((file) => {
                const isActive = file === activeFileName;
                const isModified = Boolean(aiCustomCode[`${currentTab}:${file}`]);

                return (
                  <button
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono text-left transition-all shrink-0 lg:shrink w-auto lg:w-full ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{file}</span>
                    {isModified && (
                      <span className="ml-auto text-[10px] text-emerald-400 font-sans font-bold">
                        AI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-9 bg-slate-950 flex flex-col min-h-[500px]">
            {/* File Info & Actions Bar */}
            <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-mono text-slate-300">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-white">{activeFileName}</span>
                <span className="text-slate-400">· {codeLines.length} lines</span>
              </div>

              <div className="flex items-center gap-2">
                {/* AI Refactor Button */}
                <button
                  onClick={handleTriggerAiRefactor}
                  disabled={isAiRefactoring}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Refactor with Gemini AI"
                >
                  {isAiRefactoring ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Refactoring...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Refactor (AI)</span>
                    </>
                  )}
                </button>

                {/* Copy Code */}
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Download Single File */}
                <button
                  onClick={handleDownloadSingleFile}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Download this file"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Code Pre/Syntax Viewer */}
            <div className="flex-1 overflow-auto max-h-[550px] p-4 text-xs font-mono bg-slate-950/90 text-slate-200">
              <pre className="table w-full">
                {codeLines.map((line, index) => (
                  <div key={index} className="table-row leading-relaxed hover:bg-slate-900/50">
                    <span className="table-cell select-none pr-4 text-right text-slate-600 font-mono text-[11px] w-12">
                      {index + 1}
                    </span>
                    <span className="table-cell whitespace-pre font-mono break-all sm:break-normal text-slate-200">
                      {line || ' '}
                    </span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

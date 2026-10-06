import React, { useState } from 'react';
import {
  X,
  Download,
  FolderArchive,
  CheckCircle2,
  FileCode2,
  Layers,
  Smartphone,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import type { ExtractionResult, ProjectFormat } from '../types.ts';
import { downloadProjectZip } from '../services/zipDownloader.ts';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  extraction: ExtractionResult;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  extraction,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ProjectFormat>('nextjs');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleStartDownload = async () => {
    setIsDownloading(true);
    setHasDownloaded(false);
    setDownloadProgress(10);
    setProgressStatus('Initializing ZIP package...');

    try {
      await downloadProjectZip(extraction, selectedFormat, (percent, status) => {
        setDownloadProgress(percent);
        setProgressStatus(status);
      });
      setHasDownloaded(true);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      setProgressStatus('Failed to generate ZIP. Retrying...');
    } finally {
      setIsDownloading(false);
    }
  };

  const formats = [
    {
      id: 'nextjs' as ProjectFormat,
      title: 'Next.js 15 App Router Project',
      subtitle: 'Modern React 19 + Next.js App Router with TypeScript & Tailwind CSS',
      badge: 'Recommended',
      filesCount: Object.keys(extraction.projects.nextjs).length,
      icon: Layers,
    },
    {
      id: 'react' as ProjectFormat,
      title: 'React + Vite Project',
      subtitle: 'Fast SPA with Vite, React 19, Tailwind CSS and modular components',
      badge: 'Lightweight',
      filesCount: Object.keys(extraction.projects.react).length,
      icon: FileCode2,
    },
    {
      id: 'html5' as ProjectFormat,
      title: 'Pure HTML5 / CSS3 / JS Bundle',
      subtitle: 'Offline ready static website — mobile browser mein direct bina npm ke chalta hai',
      badge: 'Instant Offline',
      filesCount: Object.keys(extraction.projects.html5).length,
      icon: FolderArchive,
    },
    {
      id: 'all' as ProjectFormat,
      title: 'Master Bundle (All Formats)',
      subtitle: 'Includes Next.js, React, HTML5, raw sources, and project metadata',
      badge: 'All-in-One',
      filesCount:
        Object.keys(extraction.projects.nextjs).length +
        Object.keys(extraction.projects.react).length +
        Object.keys(extraction.projects.html5).length +
        2,
      icon: FolderArchive,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Download Website Source Code (.ZIP)
              </h3>
              <p className="text-xs text-slate-400">
                Apne mobile ya PC mein poora project ZIP archive save karein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 px-1">
            PROJECT FORMAT CHOOSE KAREIN:
          </div>

          {formats.map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = selectedFormat === fmt.id;

            return (
              <div
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{fmt.title}</span>
                        <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                          {fmt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{fmt.subtitle}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {fmt.filesCount} project files included
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-700 bg-transparent'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Mobile Tips Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">Mobile Download Tip:</p>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                Download karne ke baad iPhone pe <strong>Files App</strong> mein tap karke uncompress karein, ya Android pe <strong>Files by Google</strong> se extract karein. HTML5 bundle bina kisi computer ke direct mobile browser mein chal jati hai!
              </p>
            </div>
          </div>

          {/* Progress bar during download */}
          {isDownloading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>{progressStatus}</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {hasDownloaded && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Project ZIP archive successfully downloaded! Check your browser downloads.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleStartDownload}
            disabled={isDownloading}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating ZIP...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download {selectedFormat.toUpperCase()} .ZIP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

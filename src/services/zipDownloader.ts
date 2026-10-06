import JSZip from 'jszip';
import type { ExtractionResult, ProjectFormat } from '../types.ts';

/**
 * Generates and triggers mobile-safe browser download for project ZIP
 */
export async function downloadProjectZip(
  extraction: ExtractionResult,
  format: ProjectFormat,
  onProgress?: (percent: number, status: string) => void
): Promise<void> {
  const zip = new JSZip();
  const safeName = (extraction.meta.title || extraction.domain || 'extracted-project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'extracted-project';

  if (onProgress) onProgress(15, 'Preparing files...');

  if (format === 'nextjs') {
    const files = extraction.projects.nextjs;
    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content);
    }
  } else if (format === 'react') {
    const files = extraction.projects.react;
    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content);
    }
  } else if (format === 'html5') {
    const files = extraction.projects.html5;
    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content);
    }
  } else if (format === 'all') {
    // Next.js folder
    const nextFolder = zip.folder('nextjs-app');
    for (const [path, content] of Object.entries(extraction.projects.nextjs)) {
      nextFolder?.file(path, content);
    }

    // React folder
    const reactFolder = zip.folder('react-vite-app');
    for (const [path, content] of Object.entries(extraction.projects.react)) {
      reactFolder?.file(path, content);
    }

    // HTML static folder
    const htmlFolder = zip.folder('html5-static');
    for (const [path, content] of Object.entries(extraction.projects.html5)) {
      htmlFolder?.file(path, content);
    }

    // Root metadata & README
    zip.file(
      'PROJECT_INFO.json',
      JSON.stringify(
        {
          sourceUrl: extraction.url,
          extractedAt: extraction.timestamp,
          meta: extraction.meta,
          stats: extraction.stats,
          assets: extraction.assets,
        },
        null,
        2
      )
    );
  }

  if (onProgress) onProgress(60, 'Compressing project ZIP archive...');

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(60 + Math.round(metadata.percent * 0.35), `Compressing: ${Math.round(metadata.percent)}%`);
      }
    }
  );

  if (onProgress) onProgress(98, 'Triggering download...');

  // Mobile-safe file download trigger
  const fileName = `${safeName}-${format}.zip`;
  const blobUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    if (onProgress) onProgress(100, 'Download ready!');
  }, 1000);
}

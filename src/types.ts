export interface ScrapedAsset {
  type: 'image' | 'svg' | 'font' | 'css' | 'js';
  url: string;
  name: string;
  size?: string;
  alt?: string;
}

export interface ExtractedMeta {
  title: string;
  description: string;
  favicon: string;
  canonicalUrl: string;
  themeColor?: string;
  ogImage?: string;
  ogSiteName?: string;
  keywords?: string[];
  lang?: string;
}

export interface ProjectFiles {
  [filePath: string]: string;
}

export interface ExtractionResult {
  url: string;
  domain: string;
  timestamp: string;
  meta: ExtractedMeta;
  stats: {
    htmlLength: number;
    cssLength: number;
    jsLength: number;
    imageCount: number;
    svgCount: number;
    linkCount: number;
    scriptsCount: number;
    stylesCount: number;
  };
  rawHtml: string;
  beautifiedHtml: string;
  extractedCss: string;
  extractedJs: string;
  assets: ScrapedAsset[];
  projects: {
    nextjs: ProjectFiles;
    react: ProjectFiles;
    html5: ProjectFiles;
  };
}

export type ProjectFormat = 'nextjs' | 'react' | 'html5' | 'all';

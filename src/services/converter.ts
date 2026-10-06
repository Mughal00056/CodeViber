/**
 * HTML to React & Next.js Transformation Engine
 * Converts parsed web HTML into idiomatic React components & Next.js 15 App Router projects.
 */

import type { ExtractedMeta, ProjectFiles } from '../types.ts';

// Clean inline style string to React style object string
export function convertStyleToReact(styleStr: string): string {
  if (!styleStr || typeof styleStr !== 'string') return '{}';
  const declarations = styleStr.split(';').filter((d) => d.trim().length > 0);
  const styleObj: Record<string, string> = {};

  for (const dec of declarations) {
    const colonIdx = dec.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = dec.slice(0, colonIdx).trim();
    const val = dec.slice(colonIdx + 1).trim();
    if (!prop || !val) continue;

    // convert kebab-case to camelCase
    const camelProp = prop.replace(/-([a-z])/g, (_, g1) => g1.toUpperCase());
    styleObj[camelProp] = val;
  }

  return JSON.stringify(styleObj);
}

// Convert HTML string to JSX compliant markup
export function htmlToJsx(html: string): string {
  if (!html) return '';

  let jsx = html;

  // 1. Remove HTML comments or convert to JSX comments
  jsx = jsx.replace(/<!--[\s\S]*?-->/g, (match) => {
    const cleaned = match.replace(/<!--|-->/g, '').trim();
    return `{/* ${cleaned.replace(/\*\//g, '* /')} */}`;
  });

  // 2. Convert class="..." and class='...' to className="..."
  jsx = jsx.replace(/\bclass=(["'])(.*?)\1/gi, 'className="$2"');

  // 3. Convert for="..." to htmlFor="..."
  jsx = jsx.replace(/\bfor=(["'])(.*?)\1/gi, 'htmlFor="$2"');

  // 4. Convert SVG and form camelCase attributes
  const attrMap: Record<string, string> = {
    'tabindex': 'tabIndex',
    'autocomplete': 'autoComplete',
    'autofocus': 'autoFocus',
    'readonly': 'readOnly',
    'colspan': 'colSpan',
    'rowspan': 'rowSpan',
    'maxlength': 'maxLength',
    'minlength': 'minLength',
    'contenteditable': 'contentEditable',
    'spellcheck': 'spellCheck',
    'crossorigin': 'crossOrigin',
    'fill-rule': 'fillRule',
    'clip-rule': 'clipRule',
    'stroke-width': 'strokeWidth',
    'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin',
    'stroke-miterlimit': 'strokeMiterlimit',
    'stroke-dasharray': 'strokeDasharray',
    'stroke-dashoffset': 'strokeDashoffset',
    'stroke-opacity': 'strokeOpacity',
    'fill-opacity': 'fillOpacity',
    'clip-path': 'clipPath',
    'viewbox': 'viewBox',
    'preserveaspectratio': 'preserveAspectRatio',
  };

  for (const [attr, replacement] of Object.entries(attrMap)) {
    const regex = new RegExp(`\\b${attr}=`, 'gi');
    jsx = jsx.replace(regex, `${replacement}=`);
  }

  // 5. Convert inline styles: style="..." -> style={{ ... }}
  jsx = jsx.replace(/\bstyle=(["'])(.*?)\1/gi, (_, _quote, styleValue) => {
    try {
      const declarations = styleValue.split(';').filter((d: string) => d.trim().length > 0);
      const props: string[] = [];
      for (const dec of declarations) {
        const colonIdx = dec.indexOf(':');
        if (colonIdx === -1) continue;
        const p = dec.slice(0, colonIdx).trim();
        const v = dec.slice(colonIdx + 1).trim();
        if (!p || !v) continue;
        const camel = p.startsWith('--') ? p : p.replace(/-([a-z])/g, (_: string, g: string) => g.toUpperCase());
        props.push(`${JSON.stringify(camel)}: ${JSON.stringify(v)}`);
      }
      return `style={{ ${props.join(', ')} }}`;
    } catch {
      return '';
    }
  });

  // 6. Ensure void elements are self-closing
  const voidTags = ['img', 'input', 'br', 'hr', 'link', 'meta', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr'];
  for (const tag of voidTags) {
    // Matches <tag ...> that are not already self-closing <tag ... />
    const regex = new RegExp(`<(${tag})\\b([^>]*?)(?<!\\/)>`, 'gi');
    jsx = jsx.replace(regex, '<$1$2 />');
  }

  // 7. Strip scripts and noscripts from JSX (handled separately)
  jsx = jsx.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  jsx = jsx.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  return jsx;
}

// Generate Next.js Project Bundle
export function generateNextJsProject(
  meta: ExtractedMeta,
  components: {
    navbarJsx: string;
    heroJsx: string;
    mainJsx: string;
    footerJsx: string;
  },
  extractedCss: string
): ProjectFiles {
  const title = meta.title || 'Extracted Website';
  const description = meta.description || 'Generated Next.js application from extracted source code.';

  const packageJson = JSON.stringify(
    {
      name: (meta.title || 'extracted-project')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'extracted-web-app',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        next: '^15.1.0',
        'lucide-react': '^0.460.0',
        'clsx': '^2.1.1',
        'tailwind-merge': '^2.5.4',
      },
      devDependencies: {
        typescript: '^5.7.0',
        '@types/node': '^22.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        postcss: '^8.4.49',
        tailwindcss: '^3.4.17',
        autoprefixer: '^10.4.20',
        eslint: '^9.0.0',
        'eslint-config-next': '^15.1.0',
      },
    },
    null,
    2
  );

  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
`;

  const tsconfig = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

  const tailwindConfig = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
`;

  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Extracted Original Stylesheet */
${extractedCss || '/* No custom inline styles extracted */'}
`;

  const layoutTsx = `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  openGraph: {
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(description)},
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
`;

  const pageTsx = `'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MainContent from '@/components/MainContent';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <MainContent />
      </main>
      <Footer />
    </div>
  );
}
`;

  const navbarComponent = `'use client';

import React, { useState } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur border-b border-slate-200/80 bg-white/95">
      ${components.navbarJsx ? components.navbarJsx : `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="font-bold text-xl tracking-tight text-slate-900">
          ${meta.title || 'Brand'}
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-slate-900 transition-colors">Home</a>
          <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#about" className="hover:text-slate-900 transition-colors">About</a>
        </nav>
      </div>`}
    </header>
  );
}
`;

  const heroComponent = `'use client';

import React from 'react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-12 md:py-20">
      ${components.heroJsx ? components.heroJsx : `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
          ${meta.title || 'Welcome'}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
          ${meta.description || 'Extracted website transformed into modern Next.js 15 App Router code.'}
        </p>
      </div>`}
    </section>
  );
}
`;

  const mainContentComponent = `'use client';

import React from 'react';

export default function MainContent() {
  return (
    <section className="py-12 bg-slate-50">
      ${components.mainJsx ? components.mainJsx : `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose max-w-none">
          <p>Main content section extracted from source.</p>
        </div>
      </div>`}
    </section>
  );
}
`;

  const footerComponent = `'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-12">
      ${components.footerJsx ? components.footerJsx : `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <p>© ${new Date().getFullYear()} ${meta.title || 'Website'}. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>`}
    </footer>
  );
}
`;

  const readme = `# Extracted Next.js 15 Project

Original source extracted from: [${meta.canonicalUrl || 'Website'}](${meta.canonicalUrl || '#'})

## 🚀 Quick Start

Run this project on your mobile browser or desktop computer:

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in browser
http://localhost:3000
\`\`\`

## 📁 File Structure

- \`app/layout.tsx\` - Root layout with extracted metadata & fonts
- \`app/page.tsx\` - Main page composing modular components
- \`app/globals.css\` - Tailwind styles + extracted stylesheets
- \`components/Navbar.tsx\` - Navigation header
- \`components/Hero.tsx\` - Hero banner
- \`components/MainContent.tsx\` - Body sections & layout
- \`components/Footer.tsx\` - Footer
`;

  return {
    'package.json': packageJson,
    'next.config.mjs': nextConfig,
    'tsconfig.json': tsconfig,
    'tailwind.config.ts': tailwindConfig,
    'postcss.config.js': postcssConfig,
    'app/layout.tsx': layoutTsx,
    'app/page.tsx': pageTsx,
    'app/globals.css': globalsCss,
    'components/Navbar.tsx': navbarComponent,
    'components/Hero.tsx': heroComponent,
    'components/MainContent.tsx': mainContentComponent,
    'components/Footer.tsx': footerComponent,
    'README.md': readme,
  };
}

// Generate React + Vite Project Bundle
export function generateReactProject(
  meta: ExtractedMeta,
  components: {
    navbarJsx: string;
    heroJsx: string;
    mainJsx: string;
    footerJsx: string;
  },
  extractedCss: string
): ProjectFiles {
  const title = meta.title || 'Extracted React App';

  const packageJson = JSON.stringify(
    {
      name: (meta.title || 'extracted-react')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'extracted-react-app',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        'lucide-react': '^0.460.0',
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        '@vitejs/plugin-react': '^4.3.4',
        autoprefixer: '^10.4.20',
        postcss: '^8.4.49',
        tailwindcss: '^3.4.17',
        typescript: '^5.7.0',
        vite: '^6.0.0',
      },
    },
    null,
    2
  );

  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  const appTsx = `import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MainContent from './components/MainContent';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <MainContent />
      </main>
      <Footer />
    </div>
  );
}
`;

  const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

  const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Extracted custom styles */
${extractedCss || '/* No custom inline styles */'}
`;

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

  const tsconfig = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
`;

  const navbarComponent = `import React from 'react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur border-b border-slate-200 bg-white/95">
      ${components.navbarJsx ? components.navbarJsx : `<div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <span className="font-bold text-xl text-slate-900">${meta.title || 'Brand'}</span>
      </div>`}
    </header>
  );
}
`;

  const heroComponent = `import React from 'react';

export default function Hero() {
  return (
    <section className="py-16 md:py-24">
      ${components.heroJsx ? components.heroJsx : `<div className="max-w-6xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">${meta.title || 'Welcome'}</h1>
      </div>`}
    </section>
  );
}
`;

  const mainContentComponent = `import React from 'react';

export default function MainContent() {
  return (
    <section className="py-12 bg-slate-50">
      ${components.mainJsx ? components.mainJsx : `<div className="max-w-6xl mx-auto px-4">
        <p>Main content extracted from source.</p>
      </div>`}
    </section>
  );
}
`;

  const footerComponent = `import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 py-12">
      ${components.footerJsx ? components.footerJsx : `<div className="max-w-6xl mx-auto px-4 text-center text-sm">
        <p>© ${new Date().getFullYear()} ${meta.title || 'Website'}. All rights reserved.</p>
      </div>`}
    </footer>
  );
}
`;

  const readme = `# Extracted React + Vite Project

Source extracted from: [${meta.canonicalUrl || 'Website'}](${meta.canonicalUrl || '#'})

## 🚀 Running the project

\`\`\`bash
npm install
npm run dev
\`\`\`
`;

  return {
    'package.json': packageJson,
    'vite.config.ts': viteConfig,
    'tsconfig.json': tsconfig,
    'tailwind.config.js': tailwindConfig,
    'index.html': indexHtml,
    'src/main.tsx': mainTsx,
    'src/App.tsx': appTsx,
    'src/index.css': indexCss,
    'src/components/Navbar.tsx': navbarComponent,
    'src/components/Hero.tsx': heroComponent,
    'src/components/MainContent.tsx': mainContentComponent,
    'src/components/Footer.tsx': footerComponent,
    'README.md': readme,
  };
}

// Generate Clean HTML5 + CSS + JS Static Project Bundle
export function generateHtml5Project(
  meta: ExtractedMeta,
  rawHtml: string,
  extractedCss: string,
  extractedJs: string
): ProjectFiles {
  const title = meta.title || 'Extracted Website';

  const cleanHtml = `<!DOCTYPE html>
<html lang="${meta.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${meta.description || ''}">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
${rawHtml}
  <script src="js/main.js"></script>
</body>
</html>
`;

  const readme = `# Extracted HTML5 / CSS3 / JS Static Website

Clean static web bundle extracted from: [${meta.canonicalUrl || 'Website'}](${meta.canonicalUrl || '#'})

## How to use
- Open \`index.html\` directly in any mobile or desktop web browser!
- No build tools or node_modules required.
`;

  return {
    'index.html': cleanHtml,
    'css/style.css': extractedCss || '/* Extracted Stylesheet */\n',
    'js/main.js': extractedJs || '// Extracted JavaScript\nconsole.log("Extracted project initialized");\n',
    'README.md': readme,
  };
}

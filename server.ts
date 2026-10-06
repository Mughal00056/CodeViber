import express from 'express';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  htmlToJsx,
  generateNextJsProject,
  generateReactProject,
  generateHtml5Project,
} from './src/services/converter.ts';
import type { ExtractedMeta, ScrapedAsset, ExtractionResult } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Helper: normalize URLs
function normalizeUrl(targetUrl: string): string {
  let url = targetUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

// Helper: resolve relative url
function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

// Scrape API Endpoint
app.post('/api/extract', async (req, res) => {
  try {
    let { url, rawHtmlInput, extractExternalCss = true } = req.body;

    let targetUrl = '';
    let htmlContent = '';
    let domain = 'localhost';

    if (rawHtmlInput && typeof rawHtmlInput === 'string' && rawHtmlInput.trim().length > 0) {
      htmlContent = rawHtmlInput;
      targetUrl = url ? normalizeUrl(url) : 'https://custom-input.local';
      try {
        domain = new URL(targetUrl).hostname;
      } catch {
        domain = 'custom-input';
      }
    } else {
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Please enter a valid website URL' });
      }

      targetUrl = normalizeUrl(url);
      try {
        domain = new URL(targetUrl).hostname;
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Fetch webpage with standard browser headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Website responded with HTTP status ${response.status} (${response.statusText})`,
        });
      }

      htmlContent = await response.text();
    }

    // Load into Cheerio for parsing
    const $ = cheerio.load(htmlContent);

    // Extract Metadata
    const title =
      $('title').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      domain;

    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';

    let rawFavicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      '/favicon.ico';
    const favicon = resolveUrl(rawFavicon, targetUrl);

    const ogImageRaw = $('meta[property="og:image"]').attr('content');
    const ogImage = ogImageRaw ? resolveUrl(ogImageRaw, targetUrl) : undefined;
    const themeColor = $('meta[name="theme-color"]').attr('content');
    const canonicalRaw = $('link[rel="canonical"]').attr('href');
    const canonicalUrl = canonicalRaw ? resolveUrl(canonicalRaw, targetUrl) : targetUrl;
    const lang = $('html').attr('lang') || 'en';

    const meta: ExtractedMeta = {
      title,
      description,
      favicon,
      canonicalUrl,
      themeColor,
      ogImage,
      lang,
    };

    // Extract Assets (Images, SVGs, Fonts)
    const assets: ScrapedAsset[] = [];
    const seenAssetUrls = new Set<string>();

    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.startsWith('data:')) {
        const fullSrc = resolveUrl(src, targetUrl);
        if (!seenAssetUrls.has(fullSrc)) {
          seenAssetUrls.add(fullSrc);
          assets.push({
            type: 'image',
            url: fullSrc,
            name: path.basename(new URL(fullSrc, targetUrl).pathname) || 'image.png',
            alt: $(el).attr('alt') || '',
          });
        }
      }
    });

    // SVGs
    let svgCount = $('svg').length;
    $('svg').each((idx, el) => {
      if (idx < 5) {
        assets.push({
          type: 'svg',
          url: '',
          name: `icon-${idx + 1}.svg`,
        });
      }
    });

    // Stylesheets collection
    const extractedCssParts: string[] = [];

    // Inline style tags
    $('style').each((_, el) => {
      const cssText = $(el).text().trim();
      if (cssText) {
        extractedCssParts.push(`/* Inline Style */\n${cssText}`);
      }
    });

    // Linked CSS files
    const cssLinks: string[] = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullHref = resolveUrl(href, targetUrl);
        cssLinks.push(fullHref);
        assets.push({
          type: 'css',
          url: fullHref,
          name: path.basename(new URL(fullHref, targetUrl).pathname) || 'styles.css',
        });
      }
    });

    // Fetch up to 5 external stylesheets if requested
    if (extractExternalCss && cssLinks.length > 0) {
      const fetchCssPromises = cssLinks.slice(0, 5).map(async (cssUrl) => {
        try {
          const cssRes = await fetch(cssUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
            },
          });
          if (cssRes.ok) {
            const cssText = await cssRes.text();
            // limit per file size to 250KB to keep things light and fast
            return `/* Stylesheet from: ${cssUrl} */\n` + cssText.slice(0, 250000);
          }
        } catch {
          // ignore external CSS fetch failure
        }
        return '';
      });

      const fetchedCss = await Promise.all(fetchCssPromises);
      for (const text of fetchedCss) {
        if (text) extractedCssParts.push(text);
      }
    }

    const combinedCss = extractedCssParts.join('\n\n');

    // Scripts collection
    const extractedJsParts: string[] = [];
    $('script').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        const fullSrc = resolveUrl(src, targetUrl);
        assets.push({
          type: 'js',
          url: fullSrc,
          name: path.basename(new URL(fullSrc, targetUrl).pathname) || 'script.js',
        });
      } else {
        const type = $(el).attr('type');
        if (!type || type.includes('javascript')) {
          const scriptText = $(el).text().trim();
          if (scriptText && !scriptText.includes('window.__INITIAL_STATE__')) {
            extractedJsParts.push(`// Inline script\n${scriptText.slice(0, 50000)}`);
          }
        }
      }
    });

    const combinedJs = extractedJsParts.join('\n\n');

    // Semantic Section Extraction for React / Next.js
    let navbarHtml = $('header').first().html() || $('nav').first().html() || '';
    let footerHtml = $('footer').first().html() || '';
    
    // Hero section detection
    let heroHtml =
      $('[class*="hero"], [id*="hero"], section:first-of-type').first().html() ||
      $('main').find('section').first().html() ||
      '';

    // Main section detection
    let mainHtml = $('main').html() || '';
    if (!mainHtml) {
      // Create body clone without header and footer
      const bodyClone = $('body').clone();
      bodyClone.find('header, nav, footer, script, style, noscript, svg').remove();
      mainHtml = bodyClone.html() || '<p>Extracted content</p>';
    }

    // Convert extracted semantic pieces to JSX
    const navbarJsx = navbarHtml ? htmlToJsx(navbarHtml) : '';
    const heroJsx = heroHtml ? htmlToJsx(heroHtml) : '';
    const mainJsx = mainHtml ? htmlToJsx(mainHtml.slice(0, 100000)) : '';
    const footerJsx = footerHtml ? htmlToJsx(footerHtml) : '';

    const components = {
      navbarJsx,
      heroJsx,
      mainJsx,
      footerJsx,
    };

    // Generate complete project bundles
    const nextjsProject = generateNextJsProject(meta, components, combinedCss);
    const reactProject = generateReactProject(meta, components, combinedCss);
    const html5Project = generateHtml5Project(meta, htmlContent, combinedCss, combinedJs);

    const stats = {
      htmlLength: htmlContent.length,
      cssLength: combinedCss.length,
      jsLength: combinedJs.length,
      imageCount: assets.filter((a) => a.type === 'image').length,
      svgCount: svgCount,
      linkCount: $('a').length,
      scriptsCount: $('script').length,
      stylesCount: $('style').length + cssLinks.length,
    };

    const result: ExtractionResult = {
      url: targetUrl,
      domain,
      timestamp: new Date().toISOString(),
      meta,
      stats,
      rawHtml: htmlContent,
      beautifiedHtml: htmlContent.slice(0, 500000),
      extractedCss: combinedCss,
      extractedJs: combinedJs,
      assets: assets.slice(0, 50),
      projects: {
        nextjs: nextjsProject,
        react: reactProject,
        html5: html5Project,
      },
    };

    return res.json(result);
  } catch (error: any) {
    console.error('Error during extraction:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to extract website source code. Please verify the URL.',
    });
  }
});

// AI Refactor Endpoint using Gemini
app.post('/api/ai-refactor', async (req, res) => {
  try {
    const { code, target = 'react', componentName = 'Component', userPrompt } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required for AI refactoring' });
    }

    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Using standard algorithmic conversion.',
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are an expert TypeScript, React 19, and Next.js 15 frontend engineer.
Refactor the following extracted HTML / JSX markup into a clean, modern, fully functional ${target === 'nextjs' ? 'Next.js 15 App Router component' : 'React + Tailwind component'}.

Component Name: ${componentName}
User Instructions: ${userPrompt || 'Make it modular, responsive for mobile & desktop, replace inline styles with clean Tailwind CSS classes, use Lucide React icons where relevant, and use clean TypeScript types.'}

Original markup:
\`\`\`html
${code.slice(0, 15000)}
\`\`\`

Requirements:
- Return ONLY the TypeScript/TSX code file.
- Do NOT wrap in markdown code blocks (\`\`\`tsx).
- Include all necessary imports at the top ('use client' if using React hooks).
- Ensure 100% syntactically valid TSX without syntax errors.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let generatedCode = response.text || '';
    // Strip possible markdown fences
    generatedCode = generatedCode.replace(/^```(?:tsx|typescript|jsx|js)?\n/i, '');
    generatedCode = generatedCode.replace(/\n```$/i, '').trim();

    return res.json({ code: generatedCode });
  } catch (err: any) {
    console.error('AI Refactor error:', err);
    return res.status(500).json({
      error: err?.message || 'AI refactoring service failed',
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`WebExtractor Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

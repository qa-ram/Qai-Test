import * as cheerio from 'cheerio';
import { CategoryResult, TestCase, Finding } from './types';

// ─── Utility Helpers ───────────────────────────────────────────────

function generateId(): string {
    return Math.random().toString(36).substring(2, 10);
}

// ─── 1. SEO Analyzer ──────────────────────────────────────────────

export function analyzeSEO(html: string, url: string): CategoryResult {
    const $ = cheerio.load(html);
    const testCases: TestCase[] = [];
    const findings: Finding[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const maxScore = 10;

    // Title tag
    const title = $('title').first().text().trim();
    if (title) {
        if (title.length >= 10 && title.length <= 70) {
            testCases.push({ id: generateId(), name: 'Title Tag', status: 'passed', description: `Title found: "${title}" (${title.length} chars)` });
            score += 1;
        } else {
            testCases.push({ id: generateId(), name: 'Title Tag Length', status: 'warning', description: `Title is ${title.length} chars (recommended: 10-70)`, details: title });
            findings.push({ id: generateId(), severity: 'minor', title: 'Title tag length suboptimal', description: `Current title is ${title.length} characters. Ideal range: 10-70 characters.`, suggestion: 'Adjust your title tag to be between 10-70 characters for optimal search display.', selector: 'title', element: $.html($('title').first()) });
            score += 0.5;
        }
    } else {
        testCases.push({ id: generateId(), name: 'Title Tag', status: 'failed', description: 'No <title> tag found' });
        findings.push({ id: generateId(), severity: 'critical', title: 'Missing title tag', description: 'The page has no <title> tag. Title tags are crucial for SEO rankings and SERP display.', suggestion: 'Add a descriptive <title> tag to the <head> section of your page.', selector: 'head' });
    }

    // Meta description
    const metaDescElem = $('meta[name="description"], meta[property="description"]').first();
    const metaDesc = metaDescElem.attr('content')?.trim() || '';
    if (metaDesc) {
        if (metaDesc.length >= 50 && metaDesc.length <= 160) {
            testCases.push({ id: generateId(), name: 'Meta Description', status: 'passed', description: `Meta description found (${metaDesc.length} chars)` });
            score += 1;
        } else {
            testCases.push({ id: generateId(), name: 'Meta Description Length', status: 'warning', description: `Meta description is ${metaDesc.length} chars (recommended: 50-160)` });
            findings.push({ id: generateId(), severity: 'minor', title: 'Meta description length suboptimal', description: `Current description is ${metaDesc.length} chars. Ideal: 50-160.`, suggestion: 'Revise meta description to be between 50-160 characters.', selector: 'meta[name="description"]', element: $.html(metaDescElem) });
            score += 0.5;
        }
    } else {
        testCases.push({ id: generateId(), name: 'Meta Description', status: 'failed', description: 'No meta description found' });
        findings.push({ id: generateId(), severity: 'major', title: 'Missing meta description', description: 'No meta description tag found. This affects how your page appears in search results.', suggestion: 'Add a <meta name="description" content="..."> tag with a compelling summary.', selector: 'head' });
    }

    // H1 tag
    const h1Count = $('h1').length;
    if (h1Count === 1) {
        testCases.push({ id: generateId(), name: 'H1 Tag', status: 'passed', description: 'Exactly one H1 tag found' });
        score += 1;
    } else if (h1Count === 0) {
        testCases.push({ id: generateId(), name: 'H1 Tag', status: 'failed', description: 'No H1 tag found on the page' });
        findings.push({ id: generateId(), severity: 'major', title: 'Missing H1 heading', description: 'No H1 tag was found. H1 tags signal the main topic of a page to search engines.', suggestion: 'Add a single descriptive H1 tag to your page.' });
    } else {
        testCases.push({ id: generateId(), name: 'H1 Tag', status: 'warning', description: `Multiple H1 tags found (${h1Count}). Best practice is exactly one.` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Multiple H1 tags', description: `Found ${h1Count} H1 tags. Search engines expect a single H1.`, suggestion: 'Reduce to a single H1 and use H2-H6 for subheadings.' });
        score += 0.5;
    }

    // Heading hierarchy
    let previousLevel = 0;
    let skippedLevel = false;
    let badHeaderSelector = '';

    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const level = parseInt(el.tagName.replace('h', ''), 10);
        if (previousLevel !== 0 && level - previousLevel > 1) {
            skippedLevel = true;
            badHeaderSelector = el.tagName;
        }
        previousLevel = level;
    });

    if (!skippedLevel) {
        testCases.push({ id: generateId(), name: 'Heading Structure', status: 'passed', description: `Valid semantic heading hierarchy.` });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Heading Structure', status: 'warning', description: 'Heading levels are skipped (e.g. H1 followed immediately by H3)' });
        findings.push({ id: generateId(), severity: 'minor', title: 'Skipped heading level', description: 'Headings should follow a clean sequential structure without jumping levels.', suggestion: `Ensure headings nest strictly sequentially (H1 -> H2 -> H3). Checked offending tag: <${badHeaderSelector}>`, selector: badHeaderSelector });
        score += 0.5;
    }

    // Canonical URL
    const hasCanonical = $('link[rel="canonical"]').length > 0;
    if (hasCanonical) {
        testCases.push({ id: generateId(), name: 'Canonical URL', status: 'passed', description: 'Canonical link tag found' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Canonical URL', status: 'warning', description: 'No canonical URL specified' });
        findings.push({ id: generateId(), severity: 'minor', title: 'Missing canonical URL', description: 'No canonical link found. This can lead to duplicate content issues.', suggestion: 'Add <link rel="canonical" href="..."> to specify the preferred URL.' });
        score += 0.5;
    }

    // Open Graph tags
    const hasOgTitle = $('meta[property="og:title"]').attr('content') !== undefined;
    const hasOgDesc = $('meta[property="og:description"]').attr('content') !== undefined;
    const hasOgImage = $('meta[property="og:image"]').attr('content') !== undefined;
    const ogCount = [hasOgTitle, hasOgDesc, hasOgImage].filter(Boolean).length;

    if (ogCount === 3) {
        testCases.push({ id: generateId(), name: 'Open Graph Tags', status: 'passed', description: 'All key OG tags present (title, description, image)' });
        score += 1;
    } else if (ogCount > 0) {
        testCases.push({ id: generateId(), name: 'Open Graph Tags', status: 'warning', description: `Only ${ogCount}/3 OG tags found` });
        suggestions.push('Add complete Open Graph tags (og:title, og:description, og:image) for rich social sharing.');
        score += 0.5;
    } else {
        testCases.push({ id: generateId(), name: 'Open Graph Tags', status: 'failed', description: 'No Open Graph tags found' });
        findings.push({ id: generateId(), severity: 'minor', title: 'Missing Open Graph tags', description: 'No OG tags found. Social media shares will use generic content.', suggestion: 'Add og:title, og:description, and og:image meta tags.' });
    }

    // Robots meta
    const robotsMetaElem = $('meta[name="robots"]');
    const robotsMeta = robotsMetaElem.attr('content')?.toLowerCase() || '';
    if (robotsMeta.includes('noindex')) {
        testCases.push({ id: generateId(), name: 'Robots Meta', status: 'warning', description: 'Page is set to noindex — search engines will not index this page' });
        findings.push({ id: generateId(), severity: 'major', title: 'Page set to noindex', description: 'The robots meta tag contains "noindex". This page won\'t appear in search results.', suggestion: 'Remove "noindex" from robots meta unless intentional.', selector: 'meta[name="robots"]', element: $.html(robotsMetaElem) });
    } else {
        testCases.push({ id: generateId(), name: 'Robots Meta', status: 'passed', description: 'Page is indexable by search engines' });
        score += 1;
    }

    // Structured data
    const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
    if (hasJsonLd) {
        testCases.push({ id: generateId(), name: 'Structured Data', status: 'passed', description: 'JSON-LD structured data found' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Structured Data', status: 'warning', description: 'No structured data (JSON-LD) found' });
        suggestions.push('Add JSON-LD structured data to enable rich snippets in search results.');
    }

    // Lang attribute
    const htmlElem = $('html');
    const hasLang = htmlElem.attr('lang') !== undefined;
    if (hasLang) {
        testCases.push({ id: generateId(), name: 'Language Attribute', status: 'passed', description: 'HTML lang attribute is set' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Language Attribute', status: 'warning', description: 'No lang attribute on <html> tag' });
        findings.push({ id: generateId(), severity: 'minor', title: 'Missing lang attribute', description: 'The <html> tag has no lang attribute, which impacts SEO and accessibility.', suggestion: 'Add lang="en" (or appropriate language) to your <html> tag.', selector: 'html', element: `<html${$.html(htmlElem).substring(5, Math.min(htmlElem.toString().indexOf('>'), 100))}>` });
    }

    if (findings.length === 0) suggestions.push('Great SEO setup! Consider ongoing content optimization and keyword analysis.');

    return { category: 'SEO', icon: '🔍', score: Math.round(score * 10) / 10, maxScore, testCases, findings, suggestions };
}

// ─── 2. Accessibility Analyzer ─────────────────────────────────────

export function analyzeAccessibility(html: string): CategoryResult {
    const $ = cheerio.load(html);
    const testCases: TestCase[] = [];
    const findings: Finding[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const maxScore = 10;

    // Images without alt text
    const $images = $('img');
    const imagesWithoutAlt = $images.filter((_, el) => $(el).attr('alt') === undefined);

    if ($images.length === 0) {
        testCases.push({ id: generateId(), name: 'Image Alt Text', status: 'passed', description: 'No images found on the page' });
        score += 1.5;
    } else if (imagesWithoutAlt.length === 0) {
        testCases.push({ id: generateId(), name: 'Image Alt Text', status: 'passed', description: `All ${$images.length} images have alt attributes` });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Image Alt Text', status: 'failed', description: `${imagesWithoutAlt.length} of ${$images.length} images missing alt text` });
        findings.push({ id: generateId(), severity: 'major', title: 'Images missing alt text', description: `${imagesWithoutAlt.length} image(s) lack alt attributes. Screen readers cannot describe these images.`, element: $.html(imagesWithoutAlt.first()).substring(0, 150), suggestion: 'Add descriptive alt attributes to all <img> tags. Use alt="" for decorative images.', selector: 'img:not([alt])' });
        score += Math.max(0, 1.5 * (1 - imagesWithoutAlt.length / $images.length));
    }

    // Form labels
    const $textInputs = $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"])');
    let labeledInputs = 0;

    $textInputs.each((_, el) => {
        const $el = $(el);
        const hasAriaLabel = $el.attr('aria-label') || $el.attr('aria-labelledby');
        const id = $el.attr('id');
        const hasConnectedLabel = id && $(`label[for="${id}"]`).length > 0;
        const hasWrappingLabel = $el.closest('label').length > 0;

        if (hasAriaLabel || hasConnectedLabel || hasWrappingLabel) {
            labeledInputs++;
        }
    });

    if ($textInputs.length === 0) {
        testCases.push({ id: generateId(), name: 'Form Labels', status: 'passed', description: 'No form inputs requiring labels found' });
        score += 1.5;
    } else if (labeledInputs === $textInputs.length) {
        testCases.push({ id: generateId(), name: 'Form Labels', status: 'passed', description: `All ${$textInputs.length} inputs have associated labels` });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Form Labels', status: 'warning', description: `Found ${$textInputs.length} inputs but only ${labeledInputs} are properly labeled` });
        findings.push({ id: generateId(), severity: 'major', title: 'Form inputs lack labels', description: 'Some form inputs do not have associated <label> elements or aria-label attributes.', suggestion: 'Ensure every interactive input has an associated <label> or aria-label.', selector: 'input:not([aria-label]):not([aria-labelledby])' });
        score += 0.5;
    }

    // ARIA roles
    const ariaRoles = $('[role]').length;
    const ariaAttributes = $('[aria-label], [aria-hidden], [aria-labelledby], [aria-expanded], [aria-controls]').length;
    if (ariaRoles > 0 || ariaAttributes > 0) {
        testCases.push({ id: generateId(), name: 'ARIA Usage', status: 'passed', description: `Found ${ariaRoles} ARIA roles and ${ariaAttributes} ARIA attributes` });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'ARIA Usage', status: 'warning', description: 'No ARIA roles or attributes detected' });
        suggestions.push('Add ARIA roles and attributes to enhance navigation for assistive technologies.');
        score += 0.5;
    }

    // Semantic HTML
    const semanticElements = $('nav, main, header, footer, article, section, aside');
    if (semanticElements.length >= 3) {
        testCases.push({ id: generateId(), name: 'Semantic HTML', status: 'passed', description: `Good semantic structure: ${semanticElements.length} semantic elements used` });
        score += 1.5;
    } else if (semanticElements.length > 0) {
        testCases.push({ id: generateId(), name: 'Semantic HTML', status: 'warning', description: `Only ${semanticElements.length} semantic HTML element(s) found` });
        suggestions.push('Use more semantic HTML elements (nav, main, header, footer, article, section) for better accessibility.');
        score += 0.75;
    } else {
        testCases.push({ id: generateId(), name: 'Semantic HTML', status: 'failed', description: 'No semantic HTML elements found' });
        findings.push({ id: generateId(), severity: 'major', title: 'No semantic HTML', description: 'The page uses no semantic HTML5 elements, making it difficult for assistive technologies to navigate.', suggestion: 'Replace generic <div> wrappers with semantic elements like <nav>, <main>, <header>, <footer>.' });
    }

    // Skip navigation link
    let hasSkipLink = false;
    $('a[href^="#"]').each((_, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('skip') && (text.includes('main') || text.includes('content') || text.includes('nav'))) {
            hasSkipLink = true;
        }
    });

    if (hasSkipLink) {
        testCases.push({ id: generateId(), name: 'Skip Navigation', status: 'passed', description: 'Skip navigation link found' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Skip Navigation', status: 'warning', description: 'No skip navigation link detected' });
        suggestions.push('Add a "Skip to main content" link as the first focusable element for keyboard users.');
    }

    // Tab index misuse
    let positiveTabindex = 0;
    $('[tabindex]').each((_, el) => {
        const ti = parseInt($(el).attr('tabindex') || '0', 10);
        if (ti > 0) positiveTabindex++;
    });

    if (positiveTabindex === 0) {
        testCases.push({ id: generateId(), name: 'Tab Order', status: 'passed', description: 'No positive tabindex values found (good practice)' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Tab Order', status: 'warning', description: `Found ${positiveTabindex} elements with positive tabindex values` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Positive tabindex values', description: `${positiveTabindex} element(s) use positive tabindex, which can disrupt natural tab order.`, suggestion: 'Remove positive tabindex values. Use tabindex="0" or "-1" instead.' });
        score += 0.5;
    }

    // Focus indicators (check for outline:none without replacement)
    const outlineNone = html.match(/outline:\s*none|outline:\s*0/gi)?.length || 0;
    if (outlineNone === 0) {
        testCases.push({ id: generateId(), name: 'Focus Indicators', status: 'passed', description: 'No suppressed focus outlines detected in inline styles' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Focus Indicators', status: 'warning', description: `Found inline styles suppressing outline that might degrade focus visibility.` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Focus outlines may be suppressed', description: 'Inline styles suppress focus outlines, making keyboard navigation difficult.', suggestion: 'Ensure all interactive elements have visible focus indicators.' });
        score += 0.5;
    }

    // Language attribute (also a11y)
    if ($('html').attr('lang')) {
        testCases.push({ id: generateId(), name: 'Language Declaration', status: 'passed', description: 'Page language is declared' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Language Declaration', status: 'failed', description: 'No language attribute on <html> tag' });
        findings.push({ id: generateId(), severity: 'major', title: 'Missing language declaration', description: 'Screen readers need a language attribute to use the correct pronunciation.', suggestion: 'Add lang="en" (or appropriate language) to the <html> element.' });
    }

    return { category: 'Accessibility', icon: '♿', score: Math.round(score * 10) / 10, maxScore, testCases, findings, suggestions };
}

// ─── 3. Performance Analyzer ───────────────────────────────────────

export function analyzePerformance(html: string, headers: Record<string, string>, fetchDuration: number): CategoryResult {
    const $ = cheerio.load(html);
    const testCases: TestCase[] = [];
    const findings: Finding[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const maxScore = 10;

    // Page size & DOM Complexity
    const pageSize = new Blob([html]).size;
    const pageSizeKB = Math.round(pageSize / 1024);
    const domNodeCount = $('*').length;

    if (pageSizeKB < 100) {
        testCases.push({ id: generateId(), name: 'Page Size', status: 'passed', description: `HTML size: ${pageSizeKB}KB (excellent)` });
        score += 2;
    } else if (pageSizeKB < 300) {
        testCases.push({ id: generateId(), name: 'Page Size', status: 'passed', description: `HTML size: ${pageSizeKB}KB (acceptable)` });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Page Size', status: 'warning', description: `HTML size: ${pageSizeKB}KB (heavy)` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Large HTML document', description: `The HTML document is ${pageSizeKB}KB. Large HTML can slow initial render.`, suggestion: 'Consider code-splitting, lazy loading, and removing unused content.', selector: 'html' });
        score += 0.5;
    }

    if (domNodeCount < 800) {
        testCases.push({ id: generateId(), name: 'DOM Complexity', status: 'passed', description: `${domNodeCount} DOM nodes (optimal)` });
        score += 1;
    } else if (domNodeCount < 1500) {
        testCases.push({ id: generateId(), name: 'DOM Complexity', status: 'warning', description: `${domNodeCount} DOM nodes (moderate)` });
        score += 0.5;
    } else {
        testCases.push({ id: generateId(), name: 'DOM Complexity', status: 'failed', description: `${domNodeCount} DOM nodes (excessive)` });
        findings.push({ id: generateId(), severity: 'major', title: 'Excessive DOM Size', description: `The page contains ${domNodeCount} HTML elements. A huge DOM slows down styling, layout, and JavaScript execution.`, suggestion: 'Virtualize long lists and simplify CSS/HTML structures.', selector: 'body' });
    }

    // Response time
    if (fetchDuration < 1000) {
        testCases.push({ id: generateId(), name: 'Server Response Time', status: 'passed', description: `TTFB: ${fetchDuration}ms (fast)` });
        score += 2;
    } else if (fetchDuration < 3000) {
        testCases.push({ id: generateId(), name: 'Server Response Time', status: 'warning', description: `TTFB: ${fetchDuration}ms (moderate)` });
        suggestions.push('Server response time could be improved. Consider server-side caching or a CDN.');
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Server Response Time', status: 'failed', description: `TTFB: ${fetchDuration}ms (slow)` });
        findings.push({ id: generateId(), severity: 'major', title: 'Slow server response', description: `Server took ${fetchDuration}ms to respond. Target: under 1000ms.`, suggestion: 'Optimize server performance, implement caching, or use a CDN.' });
    }

    // Inline scripts count
    const inlineScripts = $('script:not([src])').length;
    const externalScripts = $('script[src]').length;
    testCases.push({ id: generateId(), name: 'Script Analysis', status: inlineScripts > 5 ? 'warning' : 'passed', description: `${inlineScripts} inline scripts, ${externalScripts} external scripts` });
    if (inlineScripts > 5) {
        findings.push({ id: generateId(), severity: 'minor', title: 'Many inline scripts', description: `${inlineScripts} inline scripts found. Consider externalizing for browser caching.`, suggestion: 'Move inline scripts to external files to leverage browser caching.' });
        score += 0.5;
    } else {
        score += 1.5;
    }

    // Render-blocking resources & Preconnect
    const blockingCSS = $('link[rel="stylesheet"]').length;
    const blockingScripts = $('script[src]:not([async]):not([defer]):not([type="module"])').length;
    const preconnects = $('link[rel="preconnect"], link[rel="dns-prefetch"]').length;

    if (blockingScripts === 0 && blockingCSS <= 2) {
        testCases.push({ id: generateId(), name: 'Render-Blocking Resources', status: 'passed', description: `${blockingCSS} CSS files, 0 render-blocking scripts` });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Render-Blocking Resources', status: 'warning', description: `${blockingCSS} CSS files, ${blockingScripts} render-blocking scripts` });
        if (blockingScripts > 0) {
            findings.push({ id: generateId(), severity: 'minor', title: 'Render-blocking scripts', description: `${blockingScripts} script(s) without async/defer block rendering.`, suggestion: 'Add async or defer attributes to non-critical <script> tags.', selector: 'script[src]:not([async]):not([defer]):not([type="module"])' });
        }
        score += 0.5;
    }

    if (preconnects > 0) {
        testCases.push({ id: generateId(), name: 'Early Hints', status: 'passed', description: `Found ${preconnects} preconnect/dns-prefetch hints` });
        score += 0.5;
    } else {
        testCases.push({ id: generateId(), name: 'Early Hints', status: 'warning', description: `No preconnect or dns-prefetch links found` });
        suggestions.push('Use <link rel="preconnect"> for important third-party origins to speed up connection setup.');
    }

    // Image optimization
    const $images = $('img');
    const totalImages = $images.length;
    const lazyImages = $('img[loading="lazy"]').length;
    let webpImages = 0;

    // Check picture sources or img src for webp
    $('source[type="image/webp"], img[src$=".webp"]').each(() => { webpImages++; });

    if (totalImages === 0) {
        testCases.push({ id: generateId(), name: 'Image Optimization', status: 'passed', description: 'No images to optimize' });
        score += 1.5;
    } else {
        const lazyPct = Math.round((lazyImages / totalImages) * 100);
        if (lazyImages > 0 || webpImages > 0) {
            testCases.push({ id: generateId(), name: 'Image Optimization', status: 'passed', description: `${lazyPct}% lazy-loaded, ${webpImages} WebP format signals of ${totalImages} total` });
            score += 1.5;
        } else {
            testCases.push({ id: generateId(), name: 'Image Optimization', status: 'warning', description: `${totalImages} images — none use lazy loading or WebP securely detected via attributes` });
            suggestions.push('Use loading="lazy" for below-the-fold images and serve images in WebP format.');
            score += 0.5;
        }
    }

    // Compression
    const encoding = headers['content-encoding'] || '';
    if (encoding.includes('gzip') || encoding.includes('br')) {
        testCases.push({ id: generateId(), name: 'Compression', status: 'passed', description: `Response compressed with ${encoding}` });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Compression', status: 'warning', description: 'No gzip/brotli compression detected' });
        suggestions.push('Enable gzip or Brotli compression on your server to reduce transfer size.');
        score += 0.5;
    }

    return { category: 'Performance', icon: '⚡', score: Math.round(score * 10) / 10, maxScore, testCases, findings, suggestions };
}

// ─── 4. Security Analyzer ──────────────────────────────────────────

export function analyzeSecurity(headers: Record<string, string>, url: string, html: string = ''): CategoryResult {
    const $ = cheerio.load(html);
    const testCases: TestCase[] = [];
    const findings: Finding[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const maxScore = 10;

    // HTTPS
    if (url.startsWith('https://')) {
        testCases.push({ id: generateId(), name: 'HTTPS', status: 'passed', description: 'Site is served over HTTPS' });
        score += 2;
    } else {
        testCases.push({ id: generateId(), name: 'HTTPS', status: 'failed', description: 'Site is not using HTTPS' });
        findings.push({ id: generateId(), severity: 'critical', title: 'No HTTPS', description: 'The site is served over HTTP. All data is transmitted unencrypted.', suggestion: 'Migrate to HTTPS immediately. Use Let\'s Encrypt for free SSL certificates.' });
    }

    // Security headers
    const securityHeaders: { name: string, header: string, severity: 'critical' | 'major' | 'minor', weight: number }[] = [
        { name: 'Content-Security-Policy', header: 'content-security-policy', severity: 'major', weight: 1.5 },
        { name: 'Strict-Transport-Security', header: 'strict-transport-security', severity: 'major', weight: 1.5 },
        { name: 'X-Content-Type-Options', header: 'x-content-type-options', severity: 'minor', weight: 1 },
        { name: 'X-Frame-Options', header: 'x-frame-options', severity: 'minor', weight: 1 },
        { name: 'X-XSS-Protection', header: 'x-xss-protection', severity: 'minor', weight: 0.5 },
        { name: 'Referrer-Policy', header: 'referrer-policy', severity: 'minor', weight: 0.5 },
        { name: 'Permissions-Policy', header: 'permissions-policy', severity: 'minor', weight: 0.5 },
    ];

    for (const sh of securityHeaders) {
        const value = headers[sh.header];
        if (value) {
            testCases.push({ id: generateId(), name: sh.name, status: 'passed', description: `Present: ${value.substring(0, 80)}${value.length > 80 ? '...' : ''}` });
            score += sh.weight;
        } else {
            testCases.push({ id: generateId(), name: sh.name, status: sh.severity === 'critical' || sh.severity === 'major' ? 'failed' : 'warning', description: `Missing ${sh.name} header` });
            findings.push({
                id: generateId(), severity: sh.severity,
                title: `Missing ${sh.name}`,
                description: `The ${sh.name} HTTP header is not set, which can leave the site vulnerable.`,
                suggestion: `Configure your server to include the ${sh.name} header.`
            });
        }
    }

    // Mixed content indicators
    if (url.startsWith('https://')) {
        let httpResources = 0;
        $('[src^="http://"], [href^="http://"]').each(() => { httpResources++; });

        if (httpResources === 0) {
            testCases.push({ id: generateId(), name: 'Mixed Content', status: 'passed', description: 'No mixed content detected' });
            score += 1.5;
        } else {
            testCases.push({ id: generateId(), name: 'Mixed Content', status: 'warning', description: `${httpResources} HTTP resource(s) found on HTTPS page` });
            findings.push({ id: generateId(), severity: 'major', title: 'Mixed content detected', description: `${httpResources} resource(s) loaded over HTTP on an HTTPS page.`, suggestion: 'Update all resource URLs to use HTTPS.', selector: '[src^="http://"], [href^="http://"]' });
            score += 0.5;
        }
    } else {
        score += 1.5;
    }

    // External Link Target Security
    const externalLinks = $('a[href^="http"]').filter((_, el) => {
        const href = $(el).attr('href');
        return href ? !href.includes(new URL(url).hostname) : false;
    });
    const unsafeLinks = externalLinks.filter((_, el) => {
        const target = $(el).attr('target');
        const rel = $(el).attr('rel') || '';
        return target === '_blank' && !rel.includes('noopener');
    });

    if (unsafeLinks.length === 0) {
        testCases.push({ id: generateId(), name: 'External Link Security', status: 'passed', description: 'All external target="_blank" links use generic protections or omitted target' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'External Link Security', status: 'failed', description: `${unsafeLinks.length} external links missing rel="noopener"` });
        findings.push({ id: generateId(), severity: 'major', title: 'Unsafe cross-origin links', description: `${unsafeLinks.length} external links open in a new tab without rel="noopener", leaving the original page vulnerable to malicious redirects.`, suggestion: 'Add rel="noopener noreferrer" to all links that use target="_blank".', selector: 'a[target="_blank"]:not([rel*="noopener"])', element: $.html(unsafeLinks.first()) });
    }
    return { category: 'Security', icon: '🔒', score: Math.round(Math.min(score, maxScore) * 10) / 10, maxScore, testCases, findings, suggestions };
}


// ─── 5. Link Analyzer ─────────────────────────────────────────────

export async function analyzeLinks(htmlContent: string, baseUrl: string): Promise<CategoryResult> {
    const $ = cheerio.load(htmlContent);
    const testCases: TestCase[] = [];
    const findings: Finding[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const maxScore = 10;

    // Extract all links
    const links: string[] = [];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            try {
                const resolved = new URL(href, baseUrl).href;
                if (resolved.startsWith('http')) links.push(resolved);
            } catch { /* skip invalid */ }
        }
    });

    const uniqueLinks = [...new Set(links)];
    const internalLinks = uniqueLinks.filter(l => { try { return new URL(l).hostname === new URL(baseUrl).hostname; } catch { return false; } });
    const externalLinks = uniqueLinks.filter(l => !internalLinks.includes(l));

    testCases.push({ id: generateId(), name: 'Total Links Found', status: 'passed', description: `${uniqueLinks.length} unique links (${internalLinks.length} internal, ${externalLinks.length} external)` });
    score += 2;

    // Check a sample of links for broken ones (max 15)
    // NOTE: If using background jobs later, we can check all of them. Keeping max 15 for safety against network limits.
    const linksToCheck = uniqueLinks.slice(0, 15);
    let brokenCount = 0;
    const brokenLinks: string[] = [];

    for (const link of linksToCheck) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(link, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
            clearTimeout(timeout);
            if (res.status >= 400 && res.status !== 405 && res.status !== 403) { // Ignore typical HEAD blocks
                brokenCount++;
                brokenLinks.push(`${link} (${res.status})`);
            }
        } catch {
            brokenCount++;
            brokenLinks.push(`${link} (unreachable)`);
        }
    }

    if (brokenCount === 0) {
        testCases.push({ id: generateId(), name: 'Broken Links Check', status: 'passed', description: `Checked ${linksToCheck.length} links — all valid` });
        score += 4;
    } else {
        testCases.push({ id: generateId(), name: 'Broken Links Check', status: 'failed', description: `${brokenCount} of ${linksToCheck.length} checked links are broken` });
        findings.push({ id: generateId(), severity: 'major', title: 'Broken links detected', description: `Found ${brokenCount} broken link(s): ${brokenLinks.slice(0, 3).join(', ')}${brokenLinks.length > 3 ? '...' : ''}`, suggestion: 'Fix or remove broken links to improve user experience and SEO.' });
        score += Math.max(0, 4 * (1 - brokenCount / linksToCheck.length));
    }

    // Links with target="_blank" should have rel="noopener"
    const $blankLinks = $('a[target="_blank"]');
    const unsafeBlankLinks = $blankLinks.filter((_, el) => {
        const rel = $(el).attr('rel') || '';
        return !rel.includes('noopener');
    });

    if ($blankLinks.length === 0 || unsafeBlankLinks.length === 0) {
        testCases.push({ id: generateId(), name: 'External Link Safety', status: 'passed', description: 'All target="_blank" links have rel="noopener"' });
        score += 2;
    } else {
        testCases.push({ id: generateId(), name: 'External Link Safety', status: 'warning', description: `${unsafeBlankLinks.length} target="_blank" links missing rel="noopener"` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Unsafe external links', description: `${unsafeBlankLinks.length} link(s) open in new tabs without rel="noopener", posing a security risk.`, suggestion: 'Add rel="noopener noreferrer" to all target="_blank" links.' });
        score += 1;
    }

    // Image usage check
    const imgSrcs = $('img[src]');
    testCases.push({ id: generateId(), name: 'Images Found', status: 'passed', description: `${imgSrcs.length} images detected on the page` });
    score += 2;

    return { category: 'Links & Resources', icon: '🔗', score: Math.round(Math.min(score, maxScore) * 10) / 10, maxScore, testCases, findings, suggestions };
}

// ─── 6. HTML Quality Analyzer ──────────────────────────────────────

export function analyzeHTMLQuality(html: string): CategoryResult {
    const $ = cheerio.load(html);
    const testCases: TestCase[] = [];
    const findings: Finding[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const maxScore = 10;

    // Doctype
    const hasDoctype = /<!DOCTYPE\s+html>/i.test(html);
    if (hasDoctype) {
        testCases.push({ id: generateId(), name: 'DOCTYPE Declaration', status: 'passed', description: 'Valid HTML5 doctype found' });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'DOCTYPE Declaration', status: 'failed', description: 'No DOCTYPE declaration found' });
        findings.push({ id: generateId(), severity: 'major', title: 'Missing DOCTYPE', description: 'The page lacks a DOCTYPE, which may cause browsers to render in quirks mode.', suggestion: 'Add <!DOCTYPE html> at the very beginning of the HTML document.' });
    }

    // Character encoding
    const hasCharset = $('meta[charset]').length > 0 || $('meta[content*="charset"]').length > 0;
    if (hasCharset) {
        testCases.push({ id: generateId(), name: 'Character Encoding', status: 'passed', description: 'Character encoding is declared' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Character Encoding', status: 'warning', description: 'No charset meta tag found' });
        findings.push({ id: generateId(), severity: 'minor', title: 'Missing charset', description: 'No charset declaration found. This can cause character rendering issues.', suggestion: 'Add <meta charset="UTF-8"> in the <head> section.' });
        score += 0.5;
    }

    // Deprecated tags
    const deprecatedTags = ['font', 'center', 'marquee', 'blink', 'strike', 'big', 'tt', 'u'];
    const foundDeprecated = deprecatedTags.filter(tag => $(tag).length > 0);
    if (foundDeprecated.length === 0) {
        testCases.push({ id: generateId(), name: 'Deprecated Tags', status: 'passed', description: 'No deprecated HTML tags found' });
        score += 2;
    } else {
        testCases.push({ id: generateId(), name: 'Deprecated Tags', status: 'failed', description: `Found deprecated tags: ${foundDeprecated.join(', ')}` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Deprecated HTML tags', description: `Using deprecated tags: ${foundDeprecated.join(', ')}. These are not supported in HTML5.`, suggestion: 'Replace deprecated tags with modern CSS equivalents.' });
        score += 0.5;
    }

    // Inline styles
    const inlineStyles = $('[style]').length;
    if (inlineStyles === 0) {
        testCases.push({ id: generateId(), name: 'Inline Styles', status: 'passed', description: 'No inline styles found' });
        score += 1.5;
    } else if (inlineStyles <= 15) { // increased threshold slightly since Nextjs/React inject styles sometimes
        testCases.push({ id: generateId(), name: 'Inline Styles', status: 'passed', description: `${inlineStyles} inline styles found (acceptable)` });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Inline Styles', status: 'warning', description: `${inlineStyles} inline styles found (consider externalizing)` });
        suggestions.push(`Move some of the ${inlineStyles} inline styles to external CSS files for better maintainability.`);
        score += 0.5;
    }

    // Viewport meta
    const hasViewport = $('meta[name="viewport"]').length > 0;
    if (hasViewport) {
        testCases.push({ id: generateId(), name: 'Viewport Meta', status: 'passed', description: 'Viewport meta tag is set' });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Viewport Meta', status: 'failed', description: 'No viewport meta tag found' });
        findings.push({ id: generateId(), severity: 'major', title: 'Missing viewport meta', description: 'Without a viewport meta tag, mobile browsers will render the page at desktop width.', suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>.' });
    }

    // Favicon
    const hasFavicon = $('link[rel*="icon"]').length > 0;
    if (hasFavicon) {
        testCases.push({ id: generateId(), name: 'Favicon', status: 'passed', description: 'Favicon link found' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Favicon', status: 'warning', description: 'No favicon link tag found' });
        suggestions.push('Add a favicon link tag for browser tab identification.');
        score += 0.5;
    }

    // Duplicate IDs check
    const ids: Record<string, number> = {};
    $('[id]').each((_, el) => {
        const id = $(el).attr('id');
        if (id) {
            ids[id] = (ids[id] || 0) + 1;
        }
    });

    const duplicateIds = Object.keys(ids).filter(id => ids[id] > 1);
    if (duplicateIds.length === 0) {
        testCases.push({ id: generateId(), name: 'Unique Element IDs', status: 'passed', description: `All element IDs are unique` });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Unique Element IDs', status: 'failed', description: `${duplicateIds.length} duplicate ID(s) found: ${duplicateIds.slice(0, 3).join(', ')}` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Duplicate element IDs', description: `Found duplicate IDs: ${duplicateIds.slice(0, 5).join(', ')}`, suggestion: 'Ensure all element IDs are unique within the page.' });
    }

    return { category: 'HTML Quality', icon: '📝', score: Math.round(Math.min(score, maxScore) * 10) / 10, maxScore, testCases, findings, suggestions };
}

// ─── 7. Mobile Readiness Analyzer ──────────────────────────────────

export function analyzeMobileReadiness(html: string): CategoryResult {
    const $ = cheerio.load(html);
    const testCases: TestCase[] = [];
    const findings: Finding[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const maxScore = 10;

    // Viewport
    const viewportContent = $('meta[name="viewport"]').attr('content') || '';
    if (viewportContent) {
        if (viewportContent.includes('width=device-width')) {
            testCases.push({ id: generateId(), name: 'Viewport Configuration', status: 'passed', description: `Viewport set: ${viewportContent}` });
            score += 2.5;

            if (viewportContent.includes('user-scalable=no') || viewportContent.includes('maximum-scale=1') || viewportContent.includes('maximum-scale=1.0')) {
                testCases.push({ id: generateId(), name: 'Zoom Capability', status: 'warning', description: 'User zooming may be restricted' });
                findings.push({ id: generateId(), severity: 'minor', title: 'Zoom restricted', description: 'The viewport meta restricts user scaling, which hurts accessibility.', suggestion: 'Remove user-scalable=no and maximum-scale=1 to allow pinch-zooming.' });
            } else {
                testCases.push({ id: generateId(), name: 'Zoom Capability', status: 'passed', description: 'Users can zoom the page' });
                score += 1;
            }
        } else {
            testCases.push({ id: generateId(), name: 'Viewport Configuration', status: 'warning', description: 'Viewport missing width=device-width' });
            score += 1;
        }
    } else {
        testCases.push({ id: generateId(), name: 'Viewport Configuration', status: 'failed', description: 'No viewport meta tag found' });
        findings.push({ id: generateId(), severity: 'critical', title: 'Missing viewport', description: 'The page has no viewport meta tag. Mobile browsers will render at desktop width.', suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' });
    }

    // Responsive CSS indicators (checking HTML for signs of frameworks)
    let hasTailwindOrBootstrap = false;
    $('[class]').each((_, el) => {
        const cls = $(el).attr('class') || '';
        if (cls.match(/sm:|md:|lg:|col-|flex-|grid-/)) hasTailwindOrBootstrap = true;
    });

    const hasMediaQueries = /@media/i.test(html); // still regex for css chunks

    if (hasTailwindOrBootstrap || hasMediaQueries) {
        testCases.push({ id: generateId(), name: 'Responsive Layout', status: 'passed', description: `Responsive classes or media queries detected` });
        score += 2;
    } else {
        testCases.push({ id: generateId(), name: 'Responsive Layout', status: 'warning', description: 'No inline responsive layout techniques detected (may be in external CSS)' });
        suggestions.push('Ensure responsive layouts with media queries, flexbox, or CSS grid in your stylesheets.');
        score += 1;
    }

    // Touch-friendly links (heuristic: check for very small font sizes)
    const tinyFonts = html.match(/font-size:\s*[0-9]px/gi)?.length || 0;
    if (tinyFonts === 0) {
        testCases.push({ id: generateId(), name: 'Readable Font Sizes', status: 'passed', description: 'No extremely small font sizes detected in inline styles' });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Readable Font Sizes', status: 'warning', description: `${tinyFonts} element(s) with very small font sizes found in styles` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Small font sizes', description: `Found ${tinyFonts} element(s) with single-digit pixel font sizes.`, suggestion: 'Use minimum 16px font size for body text on mobile devices.' });
        score += 0.5;
    }

    // Mobile-specific meta
    const hasAppleMeta = $('meta[name="apple-mobile-web-app-capable"]').length > 0;
    const hasThemeColor = $('meta[name="theme-color"]').length > 0;
    if (hasAppleMeta || hasThemeColor) {
        testCases.push({ id: generateId(), name: 'Mobile Meta Tags', status: 'passed', description: `Mobile optimizations found: ${[hasAppleMeta && 'apple-mobile', hasThemeColor && 'theme-color'].filter(Boolean).join(', ')}` });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Mobile Meta Tags', status: 'warning', description: 'No mobile-specific meta tags (theme-color, apple-mobile) found' });
        suggestions.push('Add theme-color and apple-mobile-web-app meta tags for a better mobile experience.');
        score += 0.5;
    }

    // Horizontal scroll risk (fixed widths in inline styles)
    const fixedWidths = html.match(/width:\s*\d{4,}px/gi)?.length || 0;
    if (fixedWidths === 0) {
        testCases.push({ id: generateId(), name: 'Horizontal Overflow', status: 'passed', description: 'No large fixed-width elements detected in inline styles' });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Horizontal Overflow', status: 'warning', description: `${fixedWidths} element(s) with large fixed widths that may cause horizontal scroll` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Potential horizontal scroll', description: `${fixedWidths} element(s) use large fixed pixel widths.`, suggestion: 'Use responsive units (%, vw, max-width) instead of fixed pixel widths.' });
    }

    return { category: 'Mobile Readiness', icon: '📱', score: Math.round(Math.min(score, maxScore) * 10) / 10, maxScore, testCases, findings, suggestions };
}

// ─── 8. Content Analyzer ───────────────────────────────────────────

export function analyzeContent(html: string): CategoryResult {
    const $ = cheerio.load(html);
    const testCases: TestCase[] = [];
    const findings: Finding[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const maxScore = 10;

    // Remove scripts and styles before extracting text
    $('script, style, noscript').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const words = textContent.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Word count
    if (wordCount > 300) {
        testCases.push({ id: generateId(), name: 'Content Volume', status: 'passed', description: `${wordCount} words (good content depth)` });
        score += 2;
    } else if (wordCount > 100) {
        testCases.push({ id: generateId(), name: 'Content Volume', status: 'warning', description: `${wordCount} words (thin content)` });
        suggestions.push('Consider adding more content. Pages with 300+ words tend to rank better.');
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Content Volume', status: 'warning', description: `Only ${wordCount} words found` });
        findings.push({ id: generateId(), severity: 'minor', title: 'Very thin content', description: `The page contains only ${wordCount} words. Search engines may consider this thin content.`, suggestion: 'Expand page content to at least 300 words for better SEO potential.' });
        score += 0.5;
    }

    // Text to HTML ratio
    const textSize = Buffer.byteLength(textContent, 'utf8');
    const htmlSize = Buffer.byteLength(html, 'utf8');
    const textRatio = htmlSize > 0 ? Math.round((textSize / htmlSize) * 100) : 0;

    if (textRatio > 25) {
        testCases.push({ id: generateId(), name: 'Text-to-HTML Ratio', status: 'passed', description: `${textRatio}% text content (excellent)` });
        score += 2;
    } else if (textRatio > 10) {
        testCases.push({ id: generateId(), name: 'Text-to-HTML Ratio', status: 'passed', description: `${textRatio}% text content (acceptable)` });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Text-to-HTML Ratio', status: 'warning', description: `${textRatio}% text content (code-heavy)` });
        suggestions.push('Low text-to-HTML ratio may indicate bloated markup. Simplify HTML structure.');
        score += 0.5;
    }

    // Readability (average word length as proxy)
    const avgWordLength = words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;
    if (avgWordLength < 7) {
        testCases.push({ id: generateId(), name: 'Readability', status: 'passed', description: `Average word length: ${avgWordLength.toFixed(1)} chars (easy reading)` });
        score += 2;
    } else {
        testCases.push({ id: generateId(), name: 'Readability', status: 'warning', description: `Average word length: ${avgWordLength.toFixed(1)} chars (complex language)` });
        suggestions.push('Consider simplifying language for broader audience accessibility.');
        score += 1;
    }

    // Paragraph structure
    const paragraphs = $('p').length;
    if (paragraphs > 0) {
        testCases.push({ id: generateId(), name: 'Content Structure', status: 'passed', description: `${paragraphs} paragraph(s) found` });
        score += 1.5;
    } else {
        testCases.push({ id: generateId(), name: 'Content Structure', status: 'warning', description: 'No <p> paragraph elements found' });
        suggestions.push('Wrap text content in <p> tags for proper semantic structure.');
        score += 0.5;
    }

    // Lists usage
    const lists = $('ul, ol').length;
    if (lists > 0) {
        testCases.push({ id: generateId(), name: 'Content Lists', status: 'passed', description: `${lists} list(s) used for content organization` });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Content Lists', status: 'warning', description: 'No ordered/unordered lists found' });
        suggestions.push('Consider using lists to organize content for better readability and SEO.');
        score += 0.5;
    }

    // Media diversity
    const hasVideo = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;
    const hasImages = $('img, picture').length > 0;
    const mediaTypes = [hasImages && 'images', hasVideo && 'video'].filter(Boolean);

    if (mediaTypes.length > 0) {
        testCases.push({ id: generateId(), name: 'Media Content', status: 'passed', description: `Media found: ${mediaTypes.join(', ')}` });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Media Content', status: 'warning', description: 'No images or video content detected' });
        suggestions.push('Add images or video to make content more engaging.');
        score += 0.5;
    }

    // --- NEW: Placeholder & Grammar Validation ---

    // 1. Placeholder Text
    const placeholderRegex = /(lorem\s+ipsum|loremipsum|dolor\s+sit\s+amet|insert\s+text\s+here|todo:|test\s+content)/i;
    let foundPlaceholder = false;
    $('p, h1, h2, h3, h4, h5, h6, span, div').each((_, el) => {
        const text = $(el).text();
        if (placeholderRegex.test(text)) {
            foundPlaceholder = true;
            findings.push({ id: generateId(), severity: 'major', title: 'Placeholder text found', description: `Detected placeholder text like "Lorem Ipsum" or "TODO".`, suggestion: 'Remove all placeholder and development text in production.', element: $.html(el).substring(0, 100), selector: el.tagName });
        }
    });

    if (foundPlaceholder) {
        testCases.push({ id: generateId(), name: 'Placeholder Text', status: 'failed', description: 'Placeholder/dummy text detected in content' });
    } else {
        testCases.push({ id: generateId(), name: 'Placeholder Text', status: 'passed', description: 'No dummy placeholder text found' });
        score += 1;
    }

    // 2. Grammar/Punctuation validation (e.g. excessive exclamation marks)
    const punctuationRegex = /([!?]){3,}/;
    if (punctuationRegex.test(textContent)) {
        testCases.push({ id: generateId(), name: 'Grammar & Tone', status: 'warning', description: 'Excessive punctuation detected (e.g., "!!!")' });
        findings.push({ id: generateId(), severity: 'minor', title: 'Excessive punctuation', description: `Found excessive repeating punctuation marks (!!! or ???) which can appear unprofessional.`, suggestion: 'Use strong vocabulary instead of repeating punctuation for emphasis.' });
    } else {
        testCases.push({ id: generateId(), name: 'Grammar & Tone', status: 'passed', description: 'No excessive punctuation detected' });
        score += 1.5;
    }

    // 3. Essential Links (Privacy Policy, TOS)
    let hasPrivacy = false;
    let hasTerms = false;
    $('a').each((_, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('privacy') || text.includes('privacy policy')) hasPrivacy = true;
        if (text.includes('terms') || text.includes('conditions')) hasTerms = true;
    });

    if (hasPrivacy && hasTerms) {
        testCases.push({ id: generateId(), name: 'Essential Legal Links', status: 'passed', description: 'Privacy Policy and Terms of Service links found' });
        score += 1;
    } else {
        testCases.push({ id: generateId(), name: 'Essential Legal Links', status: 'warning', description: `Missing crucial links: ${[!hasPrivacy && 'Privacy Policy', !hasTerms && 'Terms/Conditions'].filter(Boolean).join(', ')}` });
        suggestions.push('Consider adding visible links to a Privacy Policy and Terms of Service, often required by law.');
        score += 0.5;
    }

    return { category: 'Content Quality', icon: '📄', score: Math.round(Math.min(score, maxScore) * 10) / 10, maxScore, testCases, findings, suggestions };
}

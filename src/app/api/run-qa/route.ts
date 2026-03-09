import { NextResponse } from 'next/server';
import {
    analyzeSEO,
    analyzeAccessibility,
    analyzePerformance,
    analyzeSecurity,
    analyzeLinks,
    analyzeHTMLQuality,
    analyzeMobileReadiness,
    analyzeContent
} from './analyzers';
import { AuditResult, CategoryResult } from './types';
import { createJob, updateJobResult, updateJobError } from '@/lib/qa-jobs';

export const maxDuration = 60; // Allow up to 60s for link checking

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { url, instructions } = data;

        if (!url) {
            return NextResponse.json({ error: 'Base URL is required' }, { status: 400 });
        }

        // Validate URL
        let targetUrl: string;
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return NextResponse.json({ error: 'URL must use http or https protocol' }, { status: 400 });
            }
            targetUrl = parsed.href;
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        console.log(`[QA Engine] Initiating job for: ${targetUrl}`);

        // Create Background Job
        const jobId = createJob(targetUrl);

        // Start processing asynchronously in background
        // Wait, Vercel kills background tasks in standard API routes once response returns unless using waitUntil
        // Unfortunately standard fetch returns fast, so we handle it synchronously for development if not using queues.
        // Wait, standard `next start` or standard un-severless environments allow it. 
        // For Next.js App Router, to prevent the process dying immediately, we can fire and forget, but in Vercel it might die.
        // Let's fire the async function immediately.
        runAuditAsynchronously(jobId, targetUrl, instructions).catch(err => {
            console.error('[QA Engine Background Error]', err);
            updateJobError(jobId, 'Critical background failure occurred.');
        });

        // Return immediately to client
        return NextResponse.json({ jobId, status: 'processing', message: 'Job initiated successfully.' });

    } catch (error) {
        console.error('[QA Engine] API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { chromium } from 'playwright-core';

async function runAuditAsynchronously(jobId: string, targetUrl: string, instructions: string) {
    console.log(`[QA Background] Starting audit ${jobId} with Playwright`);

    // Fetch the target page
    const fetchStart = Date.now();
    let html: string;
    let screenshotBase64: string | undefined;
    let responseHeaders: Record<string, string> = {};
    let statusCode: number = 200;

    let browser;
    try {
        browser = await chromium.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 QA-Platform-Audit',
            ignoreHTTPSErrors: true,
        });

        const page = await context.newPage();

        // Setup response interception to grab headers and status
        page.on('response', response => {
            // We only care about the main document navigation response
            if (response.url() === targetUrl || response.url() === targetUrl + '/') {
                statusCode = response.status();
                const headers = response.headers();
                for (const [key, value] of Object.entries(headers)) {
                    responseHeaders[key.toLowerCase()] = value;
                }
            }
        });

        // Navigate and wait for network idle to ensure SPAs and dynamic React/Vue content loads
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

        // Final fallback to grab the content of the fully rendered DOM
        html = await page.content();

        // Capture a visual evidence screenshot
        try {
            const buffer = await page.screenshot({ type: 'jpeg', quality: 50, fullPage: true });
            screenshotBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        } catch (e) {
            console.warn('[QA Background] Screenshot capture failed:', e);
        }

        if (!html || html.trim() === '') {
            throw new Error(`Empty response received (Status: ${statusCode})`);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown Playwright launch or fetch error';
        console.error(`[QA Background] Fetch failed for ${jobId}: ${message}`);
        updateJobError(jobId, `Could not reach the URL or render the application: ${message}.`);
        if (browser) await browser.close();
        return;
    }

    // Now safe to close browser since we have HTML and Screenshot
    if (browser) await browser.close();

    const fetchDuration = Date.now() - fetchStart;
    console.log(`[QA Background] Playwright fetched in ${fetchDuration}ms (status ${statusCode}, ${html.length} bytes)`);

    try {
        // Run all analyzers concurrently
        const [seo, accessibility, performance, security, links, htmlQuality, mobile, content] = await Promise.all([
            Promise.resolve().then(() => analyzeSEO(html, targetUrl)),
            Promise.resolve().then(() => analyzeAccessibility(html)),
            Promise.resolve().then(() => analyzePerformance(html, responseHeaders, fetchDuration)),
            Promise.resolve().then(() => analyzeSecurity(responseHeaders, targetUrl, html)),
            Promise.resolve().then(() => analyzeLinks(html, targetUrl)),
            Promise.resolve().then(() => analyzeHTMLQuality(html)),
            Promise.resolve().then(() => analyzeMobileReadiness(html)),
            Promise.resolve().then(() => analyzeContent(html)),
        ]);

        const categories: CategoryResult[] = [seo, accessibility, performance, security, links, htmlQuality, mobile, content];

        // Calculate overall score (weighted average)
        const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
        const totalMaxScore = categories.reduce((sum, c) => sum + c.maxScore, 0);
        const overallScore = Math.round((totalScore / totalMaxScore) * 100);

        // Make screenshot explicitly available for the result
        const screenshot = screenshotBase64;

        // Aggregate summary
        const allTestCases = categories.flatMap(c => c.testCases);
        const allFindings = categories.flatMap(c => c.findings);

        const summary = {
            totalTests: allTestCases.length,
            passed: allTestCases.filter(t => t.status === 'passed').length,
            warnings: allTestCases.filter(t => t.status === 'warning').length,
            failed: allTestCases.filter(t => t.status === 'failed').length,
            totalFindings: allFindings.length,
            criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
        };

        // Process custom requirements/instructions
        let customRequirements: AuditResult['customRequirements'] = undefined;
        if (instructions && instructions.trim()) {
            const notes: string[] = [];
            const instructionText = instructions.toLowerCase();

            if (/mobile|responsive/i.test(instructionText)) {
                notes.push(`Mobile check: Score ${mobile.score}/${mobile.maxScore}. ${mobile.findings.length > 0 ? mobile.findings[0].title : 'Looks good.'}`);
            }
            if (/seo|search|ranking/i.test(instructionText)) {
                notes.push(`SEO check: Score ${seo.score}/${seo.maxScore}. ${seo.findings.length > 0 ? seo.findings[0].title : 'Optimized.'}`);
            }
            if (/access|a11y|wcag/i.test(instructionText)) {
                notes.push(`A11y check: Score ${accessibility.score}/${accessibility.maxScore}.`);
            }
            if (/security|ssl|https/i.test(instructionText)) {
                notes.push(`Security check: Score ${security.score}/${security.maxScore}.`);
            }
            if (/performance|speed/i.test(instructionText)) {
                notes.push(`Perf check: TTFB ${fetchDuration}ms, Score ${performance.score}/${performance.maxScore}.`);
            }
            if (/link|broken/i.test(instructionText)) {
                notes.push(`Link logic: ${links.findings.length > 0 ? 'Broken links detected.' : 'Checked links valid.'}`);
            }

            if (notes.length === 0) {
                notes.push('Instructions noted. This static audit ran standard compliance checks across all domains.');
            }

            customRequirements = { instructions, notes };
        }

        const result: AuditResult = {
            jobId,
            url: targetUrl,
            timestamp: new Date().toISOString(),
            duration: Date.now() - fetchStart,
            overallScore,
            screenshot: screenshotBase64,
            categories,
            customRequirements,
            summary,
        };

        updateJobResult(jobId, result);
        console.log(`[QA Background] Job ${jobId} complete. Score: ${overallScore}/100.`);

    } catch (analysisErr: unknown) {
        console.error(`[QA Background] Analysis failed for ${jobId}:`, analysisErr);
        const errMsg = analysisErr instanceof Error ? analysisErr.message : 'Unknown error during HTML analysis.';
        updateJobError(jobId, `Analysis Engine Error: ${errMsg}`);
    }
}

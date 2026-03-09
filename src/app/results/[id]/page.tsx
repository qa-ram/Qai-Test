'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Activity,
    Download, Shield, Search, Smartphone, FileText, Link2,
    Code2, Zap, ChevronDown, ChevronRight, Loader2, Globe,
    TrendingUp, AlertCircle, BarChart3, Eye, Monitor
} from 'lucide-react';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────

interface TestCase {
    id: string;
    name: string;
    status: 'passed' | 'warning' | 'failed';
    description: string;
    details?: string;
}

interface Finding {
    id: string;
    severity: 'critical' | 'major' | 'minor' | 'info';
    title: string;
    description: string;
    element?: string;
    selector?: string;
    suggestion: string;
}

interface CategoryResult {
    category: string;
    icon: string;
    score: number;
    maxScore: number;
    testCases: TestCase[];
    findings: Finding[];
    suggestions: string[];
}

interface AuditResult {
    jobId: string;
    url: string;
    timestamp: string;
    duration: number;
    overallScore: number;
    screenshot?: string;
    categories: CategoryResult[];
    customRequirements?: {
        instructions: string;
        notes: string[];
    };
    summary: {
        totalTests: number;
        passed: number;
        warnings: number;
        failed: number;
        totalFindings: number;
        criticalFindings: number;
    };
}

// ── Helper Components ────────────────────────────────────────────────

const categoryIcons: Record<string, React.ReactNode> = {
    'SEO': <Search className="w-5 h-5" />,
    'Accessibility': <Eye className="w-5 h-5" />,
    'Performance': <Zap className="w-5 h-5" />,
    'Security': <Shield className="w-5 h-5" />,
    'Links & Resources': <Link2 className="w-5 h-5" />,
    'HTML Quality': <Code2 className="w-5 h-5" />,
    'Mobile Readiness': <Smartphone className="w-5 h-5" />,
    'Content Quality': <FileText className="w-5 h-5" />,
};

function getScoreColor(score: number, max: number) {
    const pct = (score / max) * 100;
    if (pct >= 80) return { text: 'text-green-400', bg: 'bg-green-400', ring: 'ring-green-400/30', label: 'Excellent' };
    if (pct >= 60) return { text: 'text-yellow-400', bg: 'bg-yellow-400', ring: 'ring-yellow-400/30', label: 'Needs Work' };
    return { text: 'text-red-400', bg: 'bg-red-400', ring: 'ring-red-400/30', label: 'Critical' };
}

function getSeverityStyle(severity: string) {
    switch (severity) {
        case 'critical': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' };
        case 'major': return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400' };
        case 'minor': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400' };
        default: return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400' };
    }
}

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'passed': return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />;
        case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;
        case 'failed': return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
        default: return null;
    }
}

// ── Score Ring Component ─────────────────────────────────────────────

function ScoreRing({ score, maxScore, size = 120 }: { score: number; maxScore: number; size?: number }) {
    const pct = (score / maxScore) * 100;
    const color = getScoreColor(score, maxScore);
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke="currentColor"
                    className={color.text}
                    strokeWidth="6" strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ strokeDasharray: circumference }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className={`text-2xl font-bold ${color.text}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {Math.round(pct)}
                </motion.span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ 100</span>
            </div>
        </div>
    );
}

// ── Scanning Animation ───────────────────────────────────────────────

function ScanningAnimation({ url }: { url: string }) {
    const steps = [
        'Connecting to target URL...',
        'Downloading page content...',
        'Analyzing SEO signals...',
        'Checking accessibility compliance...',
        'Measuring performance metrics...',
        'Inspecting security headers...',
        'Validating links and resources...',
        'Evaluating HTML quality...',
        'Testing mobile readiness...',
        'Analyzing content quality...',
        'Generating comprehensive report...',
    ];
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1200);
        return () => clearInterval(interval);
    }, [steps.length]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full text-center space-y-8"
            >
                {/* Animated scanner */}
                <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-3 rounded-full border-4 border-transparent border-b-blue-400"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Globe className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-2">Running QA Audit</h2>
                    <p className="text-sm text-muted-foreground break-all">{url}</p>
                </div>

                {/* Progress steps */}
                <div className="text-left space-y-2 bg-card border border-border rounded-xl p-4 max-h-72 overflow-y-auto">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 py-1"
                        >
                            {i < currentStep ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                            ) : i === currentStep ? (
                                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                            )}
                            <span className={`text-sm ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

// ── Main Results Page ────────────────────────────────────────────────

function ResultsDashboardInner() {
    const searchParams = useSearchParams();
    const [result, setResult] = useState<AuditResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'findings' | 'suggestions' | 'insights'>('overview');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const reportRef = useRef<HTMLDivElement>(null);

    const targetUrl = searchParams.get('url') || '';
    const instructions = searchParams.get('instructions') || '';

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const runAudit = useCallback(async () => {
        if (!targetUrl) {
            setError('No URL provided. Please go back and enter a URL.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/run-qa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl, instructions }),
            });

            const initialData = await res.json();

            if (!res.ok || !initialData.jobId) {
                setError(initialData.error || 'Audit initialization failed');
                setLoading(false);
                return;
            }

            const jobId = initialData.jobId;

            // Start polling background job
            const pollInterval = setInterval(async () => {
                try {
                    const pollRes = await fetch(`/api/run-qa/${jobId}`);
                    const pollData = await pollRes.json();

                    if (!pollRes.ok) {
                        clearInterval(pollInterval);
                        setError(pollData.error || 'Polling failed');
                        setLoading(false);
                        return;
                    }

                    if (pollData.status === 'completed') {
                        clearInterval(pollInterval);
                        setResult(pollData.result);
                        setExpandedCategories(new Set(pollData.result.categories.map((c: CategoryResult) => c.category)));
                        setLoading(false);
                    } else if (pollData.status === 'failed') {
                        clearInterval(pollInterval);
                        setError(pollData.error || 'Auditor background task failed');
                        setLoading(false);
                    }
                } catch (pollErr) {
                    clearInterval(pollInterval);
                    setError('Lost connection to QA engine during scan.');
                    setLoading(false);
                }
            }, 2000);

        } catch (err) {
            setError('Failed to connect to the QA engine. Please try again.');
            setLoading(false);
        }
    }, [targetUrl, instructions]);

    useEffect(() => {
        runAudit();
    }, [runAudit]);

    // PDF Export
    const handleExportPDF = async () => {
        if (!reportRef.current || !result) return;

        // Dynamically import html2pdf
        const html2pdfModule = await import('html2pdf.js');
        const html2pdf = html2pdfModule.default;

        const escapeHTML = (str: string | undefined): string => {
            if (!str) return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        // Build a clean HTML report for PDF
        const allFindings = result.categories.flatMap(c => c.findings);
        const allSuggestions = result.categories.flatMap(c => c.suggestions.map(s => ({ category: c.category, suggestion: s })));

        const reportHTML = `
        <div style="font-family: 'Inter', system-ui, sans-serif; color: #0f172a; padding: 40px; background: #ffffff; width: 800px; max-width: 800px; box-sizing: border-box; margin: 0 auto;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid #f1f5f9;">
          <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.02em;">QA Audit Report</h1>
          <div style="display: flex; justify-content: center; gap: 24px; color: #64748b; font-size: 14px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 600; color: #475569;">Target:</span>
              <a href="${escapeHTML(result.url)}" style="color: #3b82f6; text-decoration: none;">${escapeHTML(result.url)}</a>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 600; color: #475569;">Date:</span>
              <span>${new Date(result.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <!-- Screenshot Section (If Available) -->
        ${result.screenshot ? `
        <div style="margin-bottom: 40px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
           <div style="background: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #475569;">Visual Evidence Captured by Playwright</div>
           <img src="${result.screenshot}" style="width: 100%; height: auto; max-height: 500px; object-fit: cover; object-position: top; display: block;" alt="Screenshot of audited page" />
        </div>
        ` : ''}

        <!-- Top Overview -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 140px;">Target URL</td>
              <td style="padding: 6px 0; font-weight: 600; color: #7c3aed; font-size: 13px;">${escapeHTML(result.url)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Audit Duration</td>
              <td style="padding: 6px 0; font-size: 13px;">${(result.duration / 1000).toFixed(1)}s</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Overall Score</td>
              <td style="padding: 6px 0; font-size: 20px; font-weight: 700; color: ${result.overallScore >= 80 ? '#22c55e' : result.overallScore >= 60 ? '#eab308' : '#ef4444'};">${result.overallScore}/100</td>
            </tr>
          </table>
        </div>

        <!-- Summary Stats -->
        <div style="display: flex; gap: 12px; margin-bottom: 30px;">
          <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${result.summary.passed}</div>
            <div style="font-size: 11px; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Passed</div>
          </div>
          <div style="flex: 1; background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #eab308;">${result.summary.warnings}</div>
            <div style="font-size: 11px; color: #a16207; text-transform: uppercase; letter-spacing: 0.5px;">Warnings</div>
          </div>
          <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${result.summary.failed}</div>
            <div style="font-size: 11px; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px;">Failed</div>
          </div>
          <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #6366f1;">${result.summary.totalTests}</div>
            <div style="font-size: 11px; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px;">Total Tests</div>
          </div>
        </div>

        <!-- Category Scores -->
        <h2 style="font-size: 18px; margin: 30px 0 16px 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Category Scores</h2>
        ${result.categories.map(cat => {
            const pct = Math.round((cat.score / cat.maxScore) * 100);
            const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444';
            return `
          <div style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 13px; font-weight: 600;">${cat.icon} ${escapeHTML(cat.category)}</span>
              <span style="font-size: 13px; font-weight: 700; color: ${color};">${pct}%</span>
            </div>
            <div style="background: #e2e8f0; border-radius: 8px; height: 8px; overflow: hidden;">
              <div style="background: ${color}; height: 100%; width: ${pct}%; border-radius: 8px;"></div>
            </div>
          </div>`;
        }).join('')}

        <!-- Findings -->
        ${allFindings.length > 0 ? `
        <h2 style="font-size: 18px; margin: 35px 0 16px 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Findings (${allFindings.length})</h2>
        ${allFindings.map((f, i) => {
            const colors: Record<string, string> = { critical: '#ef4444', major: '#f97316', minor: '#eab308', info: '#3b82f6' };
            const bgColors: Record<string, string> = { critical: '#fef2f2', major: '#fff7ed', minor: '#fefce8', info: '#eff6ff' };
            return `
          <div style="page-break-inside: avoid; break-inside: avoid; border: 1px solid #e2e8f0; border-left: 4px solid ${colors[f.severity] || '#3b82f6'}; border-radius: 8px; padding: 14px; margin-bottom: 10px; background: ${bgColors[f.severity] || '#f8fafc'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 13px; font-weight: 600; color: #1e293b;">${i + 1}. ${escapeHTML(f.title)}</span>
              <span style="font-size: 10px; padding: 2px 8px; border-radius: 999px; background: ${colors[f.severity]}22; color: ${colors[f.severity]}; font-weight: 600; text-transform: uppercase;">${f.severity}</span>
              </div>
              <p style="font-size: 12px; color: #475569; margin: 0 0 10px 0; line-height: 1.5;">${escapeHTML(f.description)}</p>
              ${f.selector ? `<div style="font-family: monospace; font-size: 10px; color: #64748b; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px;">Selector: ${escapeHTML(f.selector)}</div>` : ''}
              ${f.element ? `<pre style="font-size: 10px; color: #64748b; background: white; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; border-left: 2px solid #cbd5e1; margin: 0 0 10px 0; overflow-x: hidden; white-space: pre-wrap;">${escapeHTML(f.element)}</pre>` : ''}
              <div style="display: flex; gap: 6px; align-items: flex-start; margin-top: 10px; padding-top: 10px; border-top: 1px solid ${bgColors[f.severity] ? 'rgba(0,0,0,0.05)' : '#e2e8f0'};">
                <p style="font-size: 12px; color: #7c3aed; margin: 0; font-style: italic;">💡 ${escapeHTML(f.suggestion)}</p>
              </div>
          </div>`;
        }).join('')}
        ` : ''}

        <!-- Suggestions -->
        ${allSuggestions.length > 0 ? `
        <h2 style="font-size: 18px; margin: 35px 0 16px 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Recommendations</h2>
        ${allSuggestions.map((s, i) => `
          <div style="page-break-inside: avoid; break-inside: avoid; display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #7c3aed; font-weight: 600; font-size: 13px; min-width: 20px;">${i + 1}.</span>
            <div>
              <span style="font-size: 11px; color: #7c3aed; background: #7c3aed15; padding: 1px 6px; border-radius: 4px; font-weight: 500;">${escapeHTML(s.category)}</span>
              <p style="font-size: 12px; color: #334155; margin: 4px 0 0 0;">${escapeHTML(s.suggestion)}</p>
            </div>
          </div>
        `).join('')}
        ` : ''}

        ${result.customRequirements ? `
        <h2 style="font-size: 18px; margin: 35px 0 16px 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Custom Requirements Analysis</h2>
        <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 16px; margin-bottom: 10px;">
          <p style="font-size: 12px; color: #6d28d9; font-weight: 600; margin: 0 0 8px 0;">Instructions:</p>
          <p style="font-size: 12px; color: #475569; margin: 0 0 12px 0; font-style: italic;">"${escapeHTML(result.customRequirements.instructions)}"</p>
          ${result.customRequirements.notes.map(n => `<p style="font-size: 12px; color: #334155; margin: 0 0 6px 0; padding-left: 12px; border-left: 2px solid #7c3aed;">• ${escapeHTML(n)}</p>`).join('')}
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
          <p style="margin: 0;">QA Platform — Comprehensive Automated Quality Assurance</p>
          <p style="margin: 4px 0 0 0;">Report generated automatically. All scores are based on static HTML analysis.</p>
        </div>
      </div>
    `;

        const container = document.createElement('div');
        container.innerHTML = reportHTML;
        document.body.appendChild(container);

        try {
            await html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: `QA_Report_${result.jobId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            }).from(container).save();
        } finally {
            document.body.removeChild(container);
        }
    };

    // ── Loading state ──────────────────────────────────────────────────

    if (loading) {
        return <ScanningAnimation url={targetUrl} />;
    }

    // ── Error state ────────────────────────────────────────────────────

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full text-center space-y-6"
                >
                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Audit Failed</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Try Again
                    </Link>
                </motion.div>
            </div>
        );
    }

    if (!result) return null;

    // ── Tabs ───────────────────────────────────────────────────────────

    const tabs = [
        { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
        { id: 'scenarios' as const, label: 'Test Scenarios', icon: Activity },
        { id: 'findings' as const, label: 'Findings', icon: AlertCircle },
        { id: 'suggestions' as const, label: 'Suggestions', icon: TrendingUp },
        { id: 'insights' as const, label: 'Insights', icon: Eye },
    ];

    const allFindings = result.categories.flatMap(c => c.findings);
    const criticalFindings = allFindings.filter(f => f.severity === 'critical');
    const majorFindings = allFindings.filter(f => f.severity === 'major');
    const minorFindings = allFindings.filter(f => f.severity === 'minor');

    // ── Render ─────────────────────────────────────────────────────────

    return (
        <div ref={reportRef} className="min-h-screen bg-background text-foreground pb-20">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                                QA Audit <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">{result.jobId}</span>
                            </h1>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
                                <Globe className="w-3 h-3 shrink-0" /> {result.url}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 hover:shadow-primary/40"
                    >
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pt-8 space-y-8 relative z-10">
                {/* Overall Score + Summary */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-2xl p-6 sm:p-8"
                >
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <ScoreRing score={result.overallScore} maxScore={100} size={140} />
                        <div className="flex-1 space-y-4 text-center sm:text-left">
                            <div>
                                <h2 className="text-2xl font-bold">Overall Score: {result.overallScore}/100</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Completed in {(result.duration / 1000).toFixed(1)}s • {result.summary.totalTests} tests across {result.categories.length} categories
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> {result.summary.passed} Passed
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 text-sm font-medium">
                                    <AlertTriangle className="w-4 h-4" /> {result.summary.warnings} Warnings
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 text-sm font-medium">
                                    <XCircle className="w-4 h-4" /> {result.summary.failed} Failed
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Category Score Cards */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {result.categories.map((cat, i) => {
                        const pct = Math.round((cat.score / cat.maxScore) * 100);
                        const color = getScoreColor(cat.score, cat.maxScore);
                        return (
                            <motion.div
                                key={cat.category}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-panel p-4 rounded-xl relative overflow-hidden group cursor-pointer hover:border-primary/30 transition-colors"
                                onClick={() => {
                                    setActiveTab('scenarios');
                                    setExpandedCategories(new Set([cat.category]));
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`${color.text}`}>
                                        {categoryIcons[cat.category] || <Activity className="w-5 h-5" />}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color.text} bg-current/10`} style={{ backgroundColor: `${color.bg === 'bg-green-400' ? 'rgba(74,222,128,0.1)' : color.bg === 'bg-yellow-400' ? 'rgba(250,204,21,0.1)' : 'rgba(248,113,113,0.1)'}` }}>
                                        {color.label}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold mb-1">{pct}<span className="text-sm text-muted-foreground font-normal">%</span></div>
                                <div className="text-xs text-muted-foreground truncate">{cat.category}</div>
                                <div className="absolute bottom-0 left-0 h-1 w-full bg-border/30">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
                                        className={`h-full ${color.bg}`}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </section>

                {/* Tab Navigation */}
                <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-foreground bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : ''}`} />
                                {tab.label}
                                {tab.id === 'findings' && allFindings.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500/10 text-red-400">{allFindings.length}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 md:p-8 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {/* ── Overview Tab ── */}
                            {activeTab === 'overview' && (
                                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Audit Summary</h3>
                                        <p className="text-sm text-muted-foreground">Comprehensive analysis across {result.categories.length} QA categories with {result.summary.totalTests} individual test cases.</p>
                                    </div>

                                    {/* Score bars */}
                                    <div className="space-y-4">
                                        {result.categories.map(cat => {
                                            const pct = Math.round((cat.score / cat.maxScore) * 100);
                                            const color = getScoreColor(cat.score, cat.maxScore);
                                            return (
                                                <div key={cat.category} className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span>{cat.icon}</span>
                                                            <span className="text-sm font-medium">{cat.category}</span>
                                                            <span className="text-xs text-muted-foreground">({cat.testCases.length} tests)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold ${color.text}`}>{cat.score}/{cat.maxScore}</span>
                                                            <span className={`text-xs ${color.text}`}>({pct}%)</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-border/50 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 1 }}
                                                            className={`h-full rounded-full ${color.bg}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Quick stats */}
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-green-400">{result.summary.passed}</div>
                                            <div className="text-xs text-muted-foreground mt-1">Tests Passed</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-yellow-400">{result.summary.warnings}</div>
                                            <div className="text-xs text-muted-foreground mt-1">Warnings</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-red-400">{result.summary.failed}</div>
                                            <div className="text-xs text-muted-foreground mt-1">Failed</div>
                                        </div>
                                    </div>

                                    {/* Custom requirements summary */}
                                    {result.customRequirements && (
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                                            <h4 className="text-sm font-semibold text-primary mb-2">📋 Custom Requirements</h4>
                                            <p className="text-xs text-muted-foreground italic mb-2">&ldquo;{result.customRequirements.instructions}&rdquo;</p>
                                            <div className="space-y-1">
                                                {result.customRequirements.notes.map((note, i) => (
                                                    <p key={i} className="text-xs text-foreground pl-3 border-l-2 border-primary/30">{note}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ── Test Scenarios Tab ── */}
                            {activeTab === 'scenarios' && (
                                <motion.div key="scenarios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Test Scenarios & Cases</h3>
                                        <p className="text-sm text-muted-foreground">{result.summary.totalTests} test cases organized by category. Click a category to expand.</p>
                                    </div>

                                    {result.categories.map(cat => {
                                        const isExpanded = expandedCategories.has(cat.category);
                                        const passed = cat.testCases.filter(t => t.status === 'passed').length;
                                        const warnings = cat.testCases.filter(t => t.status === 'warning').length;
                                        const failed = cat.testCases.filter(t => t.status === 'failed').length;

                                        return (
                                            <div key={cat.category} className="border border-border rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleCategory(cat.category)}
                                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                        <span className="text-lg">{cat.icon}</span>
                                                        <span className="font-medium text-sm">{cat.category}</span>
                                                        <span className="text-xs text-muted-foreground">({cat.testCases.length} tests)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {passed > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">{passed} ✓</span>}
                                                        {warnings > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">{warnings} ⚠</span>}
                                                        {failed > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">{failed} ✗</span>}
                                                    </div>
                                                </button>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: 'auto' }}
                                                            exit={{ height: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="border-t border-border divide-y divide-border/50">
                                                                {cat.testCases.map(tc => (
                                                                    <div key={tc.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                                                                        <StatusIcon status={tc.status} />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm font-medium">{tc.name}</span>
                                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${tc.status === 'passed' ? 'bg-green-500/10 text-green-400' : tc.status === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{tc.status}</span>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground mt-0.5">{tc.description}</p>
                                                                            {tc.details && <pre className="text-[10px] text-muted-foreground/70 mt-1 truncate">{tc.details}</pre>}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {/* ── Findings Tab ── */}
                            {activeTab === 'findings' && (
                                <motion.div key="findings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Findings & Issues</h3>
                                        <p className="text-sm text-muted-foreground">{allFindings.length} issues detected across all categories.</p>
                                    </div>

                                    {allFindings.length === 0 ? (
                                        <div className="text-center py-16">
                                            <CheckCircle2 className="w-16 h-16 mx-auto text-green-400 mb-4" />
                                            <h4 className="text-lg font-semibold">No Issues Found!</h4>
                                            <p className="text-sm text-muted-foreground mt-1">All tests passed without any findings.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Severity summary */}
                                            <div className="flex flex-wrap gap-3">
                                                {criticalFindings.length > 0 && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                                                        {criticalFindings.length} Critical
                                                    </div>
                                                )}
                                                {majorFindings.length > 0 && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
                                                        {majorFindings.length} Major
                                                    </div>
                                                )}
                                                {minorFindings.length > 0 && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium">
                                                        {minorFindings.length} Minor
                                                    </div>
                                                )}
                                            </div>

                                            {/* Findings list */}
                                            <div className="space-y-3">
                                                {allFindings.sort((a, b) => {
                                                    const order = { critical: 0, major: 1, minor: 2, info: 3 };
                                                    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
                                                }).map((finding, i) => {
                                                    const style = getSeverityStyle(finding.severity);
                                                    return (
                                                        <motion.div
                                                            key={finding.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.03 }}
                                                            className={`p-4 rounded-xl border ${style.border} ${style.bg}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                                <h4 className="text-sm font-semibold">{finding.title}</h4>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase shrink-0 ${style.badge}`}>
                                                                    {finding.severity}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mb-2">{finding.description}</p>

                                                            {finding.selector && (
                                                                <div className="text-[10px] font-mono text-muted-foreground/70 bg-primary/5 border border-primary/10 px-2 py-1 inline-block rounded mb-2">
                                                                    <span className="font-semibold text-primary/60">Selector:</span> {finding.selector}
                                                                </div>
                                                            )}

                                                            {finding.element && (
                                                                <pre className="text-[10px] text-muted-foreground/70 bg-background/50 p-2 rounded mb-2 overflow-x-auto">{finding.element}</pre>
                                                            )}
                                                            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border/30">
                                                                <span className="text-primary text-xs">💡</span>
                                                                <p className="text-xs text-primary/80">{finding.suggestion}</p>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {/* ── Suggestions Tab ── */}
                            {activeTab === 'suggestions' && (
                                <motion.div key="suggestions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Recommendations & Suggestions</h3>
                                        <p className="text-sm text-muted-foreground">Actionable improvements to enhance your website quality.</p>
                                    </div>

                                    {result.categories.filter(c => c.suggestions.length > 0).map(cat => (
                                        <div key={cat.category} className="space-y-3">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <span>{cat.icon}</span> {cat.category}
                                            </h4>
                                            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                                                {cat.suggestions.map((suggestion, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                                                    >
                                                        <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                        <p className="text-sm text-foreground">{suggestion}</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Findings suggestions */}
                                    {allFindings.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-border">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">🔧 Issue-Specific Fixes</h4>
                                            <div className="space-y-2 pl-4 border-l-2 border-orange-500/20">
                                                {allFindings.map((finding, i) => (
                                                    <div key={finding.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${finding.severity === 'critical' ? 'bg-red-400' : finding.severity === 'major' ? 'bg-orange-400' : 'bg-yellow-400'}`} />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">{finding.title}</p>
                                                            <p className="text-sm text-foreground mt-0.5">{finding.suggestion}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ── Insights Tab ── */}
                            {activeTab === 'insights' && (
                                <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Detailed Insights</h3>
                                        <p className="text-sm text-muted-foreground">Deep-dive analysis of your website&apos;s quality across all dimensions.</p>
                                    </div>

                                    {/* Strengths */}
                                    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                        <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" /> Strengths
                                        </h4>
                                        <div className="space-y-2">
                                            {result.categories
                                                .filter(c => (c.score / c.maxScore) >= 0.8)
                                                .map(cat => (
                                                    <div key={cat.category} className="flex items-center gap-2 text-sm">
                                                        <span>{cat.icon}</span>
                                                        <span className="text-foreground">{cat.category}</span>
                                                        <span className="text-green-400 font-semibold">{Math.round((cat.score / cat.maxScore) * 100)}%</span>
                                                    </div>
                                                ))}
                                            {result.categories.filter(c => (c.score / c.maxScore) >= 0.8).length === 0 && (
                                                <p className="text-xs text-muted-foreground">No categories scored above 80%. See recommendations for improvement.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Areas for Improvement */}
                                    <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                                        <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Areas for Improvement
                                        </h4>
                                        <div className="space-y-2">
                                            {result.categories
                                                .filter(c => (c.score / c.maxScore) < 0.8 && (c.score / c.maxScore) >= 0.5)
                                                .map(cat => (
                                                    <div key={cat.category} className="text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span>{cat.icon}</span>
                                                            <span className="text-foreground">{cat.category}</span>
                                                            <span className="text-yellow-400 font-semibold">{Math.round((cat.score / cat.maxScore) * 100)}%</span>
                                                        </div>
                                                        {cat.findings.length > 0 && (
                                                            <p className="text-xs text-muted-foreground ml-7 mt-0.5">
                                                                {cat.findings.length} issue(s): {cat.findings.map(f => f.title).join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Critical Areas */}
                                    {result.categories.filter(c => (c.score / c.maxScore) < 0.5).length > 0 && (
                                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                            <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                                                <XCircle className="w-4 h-4" /> Critical Areas
                                            </h4>
                                            <div className="space-y-2">
                                                {result.categories
                                                    .filter(c => (c.score / c.maxScore) < 0.5)
                                                    .map(cat => (
                                                        <div key={cat.category} className="text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span>{cat.icon}</span>
                                                                <span className="text-foreground">{cat.category}</span>
                                                                <span className="text-red-400 font-semibold">{Math.round((cat.score / cat.maxScore) * 100)}%</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground ml-7 mt-0.5">
                                                                {cat.findings.map(f => f.title).join(', ')}
                                                            </p>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Technical Summary */}
                                    <div className="p-4 rounded-xl bg-card border border-border">
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-primary" /> Technical Summary
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Target URL</span>
                                                <p className="font-mono text-xs text-primary break-all">{result.url}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Audit Duration</span>
                                                <p className="font-medium">{(result.duration / 1000).toFixed(1)}s</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Timestamp</span>
                                                <p className="font-medium">{new Date(result.timestamp).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Job ID</span>
                                                <p className="font-mono text-xs">{result.jobId}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Evidence (Playwright Screenshot) */}
                                    {result.screenshot && (
                                        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                                            <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
                                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                                    <Monitor className="w-4 h-4 text-primary" /> Visual Evidence
                                                </h4>
                                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider bg-background px-2 py-0.5 rounded-full border border-border">Captured by Playwright</span>
                                            </div>
                                            <div className="relative w-full overflow-hidden bg-zinc-950 flex items-center justify-center max-h-[600px]">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={result.screenshot}
                                                    alt="Full page visual evidence"
                                                    className="w-full h-auto object-cover object-top"
                                                    loading="lazy"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Requirements */}
                                    {result.customRequirements && (
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                                            <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">📋 Your Custom Requirements</h4>
                                            <p className="text-xs text-muted-foreground italic mb-3">&ldquo;{result.customRequirements.instructions}&rdquo;</p>
                                            <div className="space-y-2">
                                                {result.customRequirements.notes.map((note, i) => (
                                                    <p key={i} className="text-sm text-foreground pl-3 border-l-2 border-primary/40">{note}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default function ResultsDashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        }>
            <ResultsDashboardInner />
        </Suspense>
    );
}

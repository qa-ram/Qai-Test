'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, LayoutDashboard, FileImage, Activity, TerminalSquare, Download, Play, Cpu } from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function ResultsDashboard({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [activeTab, setActiveTab] = useState('overview');

    // Dummy data representing a completed QA run
    const metrics = {
        performance: 88,
        accessibility: 96,
        bestPractices: 100,
        seo: 92,
    };

    const performanceData = [
        { name: 'FCP', time: 1.2 },
        { name: 'LCP', time: 2.5 },
        { name: 'TBT', time: 0.1 },
        { name: 'CLS', time: 0.04 },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="font-semibold flex items-center gap-2">
                                Test Run: <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">RUN-{unwrappedParams.id || '8B9X2'}</span>
                            </h1>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500" /> Completed on {new Date().toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => alert('Re-running test flow initialized...')}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <Play className="w-4 h-4" /> Re-run Test
                        </button>
                        <button
                            onClick={() => {
                                const dummyReport = {
                                    jobId: unwrappedParams.id || '8B9X2',
                                    date: new Date().toISOString(),
                                    url: 'https://example.com',
                                    metrics: metrics,
                                    status: 'PASSED',
                                    insights: [
                                        "Performance looks good on mobile 3G profiles.",
                                        "1 visual deviation detected in hero section vs mockups.",
                                        "All 12 mapped E2E functional test paths passed successfully."
                                    ]
                                };
                                const blob = new Blob([JSON.stringify(dummyReport, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `QA_Report_${unwrappedParams.id || '8B9X2'}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 hover:shadow-primary/40"
                        >
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pt-8 space-y-8 relative z-10">
                {/* Core Metrics Highlight */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Performance', value: metrics.performance, color: metrics.performance > 89 ? 'text-green-500' : 'text-yellow-500', icon: Activity },
                        { label: 'Accessibility', value: metrics.accessibility, color: 'text-green-500', icon: CheckCircle2 },
                        { label: 'Best Practices', value: metrics.bestPractices, color: 'text-green-500', icon: Cpu },
                        { label: 'SEO', value: metrics.seo, color: 'text-green-500', icon: LayoutDashboard }
                    ].map((score, i) => (
                        <motion.div
                            key={score.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-panel p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">{score.label}</span>
                                <score.icon className={`w-5 h-5 ${score.color} opacity-80`} />
                            </div>
                            <div className="flex items-end gap-2 text-4xl font-bold tracking-tighter">
                                <span className={score.color}>{score.value}</span>
                                <span className="text-base font-medium text-muted-foreground mb-1">/100</span>
                            </div>

                            {/* Decorative progress bar background */}
                            <div className="absolute bottom-0 left-0 h-1 bg-border/50 w-full">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score.value}%` }}
                                    transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                    className={`h-full ${score.color.replace('text-', 'bg-')}`}
                                />
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* Tabbed Detailed View */}
                <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
                        {[
                            { id: 'overview', label: 'Lighthouse Overview', icon: Activity },
                            { id: 'visual', label: 'Visual Regression', icon: FileImage },
                            { id: 'e2e', label: 'E2E Functional', icon: TerminalSquare },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-col items-center justify-center gap-1 md:flex-row md:gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-foreground bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : ''}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 md:p-8 min-h-[400px]">
                        {activeTab === 'overview' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Web Vitals Performance</h3>
                                    <p className="text-sm text-muted-foreground mb-6">Execution profile recorded over 3G throttling for consistent mobile parity.</p>

                                    <div className="h-72 w-full p-4 border border-border/50 rounded-xl bg-background/50">
                                        <ResponsiveContainer width="100%" height={280} minWidth={300} minHeight={200}>
                                            <AreaChart data={performanceData}>
                                                <defs>
                                                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}s`} />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                                />
                                                <Area type="monotone" dataKey="time" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTime)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Opportunities</h3>
                                    <div className="grid gap-3">
                                        {[
                                            { issue: "Properly size images", savings: "1.2s", type: "warning" },
                                            { issue: "Serve images in next-gen formats", savings: "0.8s", type: "warning" },
                                            { issue: "Eliminate render-blocking resources", savings: "0.4s", type: "info" }
                                        ].map((opp, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    {opp.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> : <Activity className="w-5 h-5 text-blue-500" />}
                                                    <span className="font-medium text-sm">{opp.issue}</span>
                                                </div>
                                                <span className="text-sm font-mono text-muted-foreground flex items-center gap-1">
                                                    Potential Savings: <span className="text-foreground">{opp.savings}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'visual' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">Visual AI Comparison</h3>
                                        <p className="text-sm text-muted-foreground">Comparing generated layout against mockup standard provided.</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-medium border border-yellow-500/20">
                                        <AlertTriangle className="w-4 h-4" /> 1 Deviation Detected
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Reference Mockup</h4>
                                        <div className="aspect-video bg-muted/30 border border-border rounded-xl flex items-center justify-center relative overflow-hidden group">
                                            <span className="text-muted-foreground">Reference Image Rendering...</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Actual Render</h4>
                                        <div className="aspect-video bg-muted/30 border border-border border-dashed rounded-xl flex items-center justify-center relative overflow-hidden group">
                                            {/* Simulated diff overlay */}
                                            <div className="absolute top-1/4 left-1/4 w-12 h-12 border-2 border-red-500/50 bg-red-500/10 rounded-sm animate-pulse" />
                                            <span className="text-muted-foreground">Actual DOM Capture...</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'e2e' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold">Functional Spidering</h3>
                                    <p className="text-sm text-muted-foreground">Automated workflow execution simulating user journeys.</p>
                                </div>

                                <div className="font-mono text-sm bg-[#0d1117] text-[#c9d1d9] rounded-xl p-4 overflow-x-auto space-y-2 border border-border shadow-inner">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span className="opacity-80">Browser Context Initialized (Chromium)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span className="opacity-80">Navigating to target URL...</span>
                                    </div>
                                    <div className="flex flex-col gap-1 pl-6 border-l border-white/10 ml-2 mt-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span className="opacity-80 text-xs">Verify Main Content Element loaded</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span className="opacity-80 text-xs">Execute all interactive button clicks</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-yellow-300">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span className="opacity-80 text-xs">Console Warning: Missing 'alt' text on #heroIcon</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span className="opacity-80">Spidering complete. 12 pages indexed and verified.</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

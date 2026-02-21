'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Upload, Link as LinkIcon, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [designFile, setDesignFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/run-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (data.jobId) {
        router.push(`/results/${data.jobId}`);
      }
    } catch (err) {
      console.error("Failed to start QA test:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50 mix-blend-screen animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl opacity-50 mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl w-full space-y-12 text-center"
      >
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Standardizing QA Excellence
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Comprehensive QA <br />
            <span className="text-gradient">Automated & Validated</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Run standard comprehensive QA tests instantly. Provide a Base URL and optional design references to receive full test deliverables covering functionality, UI, accessibility, and performance.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel rounded-2xl p-2 sm:p-4 max-w-2xl mx-auto relative group transition-all duration-300 hover-glow"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-2xl opacity-0 group-hover:opacity-20 transition duration-500 blur"></div>

          <form onSubmit={handleSubmit} className="relative bg-card rounded-xl shadow-sm border border-border/50 p-6 space-y-6 text-left">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-foreground flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                Base URL <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  id="url"
                  type="url"
                  required
                  placeholder="https://your-website-to-test.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Design Reference Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  Design Reference (Optional)
                </label>
                <div className="border border-dashed border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-center h-32 relative overflow-hidden group/upload">
                  {designFile ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-green-500 mb-1" />
                      <p className="text-sm font-medium truncate w-full px-2">{designFile.name}</p>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setDesignFile(null); }} className="text-xs text-destructive hover:underline mt-1">Remove</button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground group-hover/upload:text-primary transition-colors mb-1" />
                      <p className="text-xs text-muted-foreground"><span className="text-primary font-medium">Click to upload</span> or drag and drop</p>
                      <p className="text-[10px] text-muted-foreground/70">Figma URL, PNG, JPG (Max 5MB)</p>
                    </>
                  )}
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*,.pdf"
                    onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Related Docs Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Documentation (Optional)
                </label>
                <div className="border border-dashed border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-center h-32 relative group/doc">
                  <FileText className="w-6 h-6 text-muted-foreground group-hover/doc:text-purple-400 transition-colors mb-1" />
                  <p className="text-xs text-muted-foreground"><span className="text-primary font-medium">Click to upload</span> requirements</p>
                  <p className="text-[10px] text-muted-foreground/70">PDF, DOCX, TXT</p>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                Tests run in isolated browser instances and AI agents.
              </div>
              <button
                type="submit"
                disabled={!url || isSubmitting}
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-primary rounded-lg overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative">
                  {isSubmitting ? 'Initializing QA Run...' : 'Run QA Test'}
                </span>
                {!isSubmitting && <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Feature Highlights Component */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-8 border-t border-border/50 text-left">
          {[
            { title: "Standard Deliverables", desc: "Automated test plans & matrix generation" },
            { title: "Visual Regression", desc: "AI-powered mockup comparison validation" },
            { title: "Performance & A11y", desc: "Lighthouse integrated metric checks" },
            { title: "E2E Workflows", desc: "Playwright powered functional spidering" }
          ].map((feature, i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/50 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{i + 1}</div>
              <h3 className="font-medium text-sm text-foreground">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </main>
  );
}

export interface TestCase {
    id: string;
    name: string;
    status: 'passed' | 'warning' | 'failed';
    description: string;
    details?: string;
}

export interface Finding {
    id: string;
    severity: 'critical' | 'major' | 'minor' | 'info';
    title: string;
    description: string;
    element?: string;
    selector?: string; // New: CSS Selector to locate the issue
    suggestion: string;
}

export interface CategoryResult {
    category: string;
    icon: string;
    score: number;
    maxScore: number;
    testCases: TestCase[];
    findings: Finding[];
    suggestions: string[];
}

export interface AuditResult {
    jobId: string;
    url: string;
    timestamp: string;
    duration: number;
    overallScore: number;
    screenshot?: string; // Base64 JPEG screenshot from Playwright
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

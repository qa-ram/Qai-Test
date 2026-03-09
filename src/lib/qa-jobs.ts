import { AuditResult } from '../app/api/run-qa/types';

export type JobStatus = 'processing' | 'completed' | 'failed';

export interface QaJob {
    jobId: string;
    url: string;
    status: JobStatus;
    result: AuditResult | null;
    error: string | null;
    createdAt: number;
}

// In-memory store for QA jobs.
// Note: For a production scale-out architecture, this should be Redis or a Database.
// Since this requires no setup, we use an in-memory Map for now.
const jobsStore = new Map<string, QaJob>();

export function createJob(url: string): string {
    const jobId = `QA-${Date.now().toString(36).toUpperCase()}`;
    jobsStore.set(jobId, {
        jobId,
        url,
        status: 'processing',
        result: null,
        error: null,
        createdAt: Date.now()
    });

    // Auto-cleanup jobs older than 1 hour to prevent memory leaks
    cleanOldJobs();

    return jobId;
}

export function getJob(jobId: string): QaJob | undefined {
    return jobsStore.get(jobId);
}

export function updateJobResult(jobId: string, result: AuditResult) {
    const job = jobsStore.get(jobId);
    if (job) {
        job.status = 'completed';
        job.result = result;
        jobsStore.set(jobId, job);
    }
}

export function updateJobError(jobId: string, error: string) {
    const job = jobsStore.get(jobId);
    if (job) {
        job.status = 'failed';
        job.error = error;
        jobsStore.set(jobId, job);
    }
}

function cleanOldJobs() {
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();
    for (const [id, job] of jobsStore.entries()) {
        if (now - job.createdAt > oneHour) {
            jobsStore.delete(id);
        }
    }
}

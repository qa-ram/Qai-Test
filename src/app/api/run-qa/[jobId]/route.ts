import { NextResponse } from 'next/server';
import { getJob } from '@/lib/qa-jobs';

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
    const resolvedParams = await params;
    const jobId = resolvedParams.jobId;

    if (!jobId) {
        return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = getJob(jobId);

    if (!job) {
        return NextResponse.json({ error: 'Job not found or expired' }, { status: 404 });
    }

    // Don't send the full result object back if it's still processing to save bandwidth, it will be null anyway
    return NextResponse.json({
        jobId: job.jobId,
        status: job.status,
        result: job.result,
        error: job.error
    });
}

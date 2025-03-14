import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../auth/get-current-user/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function GET(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    try {
        const { data: applications, error } = await supabase
            .from('job_applications')
            .select('resume_key, company_name, position, tailored_resume_key, cover_letter_key')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching job applications:', error);
            return NextResponse.json({ error: 'Failed to fetch job applications' }, { status: 500 });
        }

        const formattedApplications = applications.map(app => ({
            resumeKey: app.resume_key,
            companyName: app.company_name,
            position: app.position,
            tailoredResumeKey: app.tailored_resume_key,
            coverLetterKey: app.cover_letter_key,
        }));

        return NextResponse.json({ applications: formattedApplications });
    } catch (error) {
        console.error('Error in user-job-postings endpoint:', error);
        return NextResponse.json({ error: 'Failed to fetch job applications' }, { status: 500 });
    }
}
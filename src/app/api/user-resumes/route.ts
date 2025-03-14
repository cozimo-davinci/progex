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
        const { data: resumes, error } = await supabase
            .from('resumes')
            .select('resume_key, file_name')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching resumes:', error);
            return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
        }

        const formattedResumes = resumes.map(resume => ({
            key: resume.resume_key,
            name: resume.file_name,
        }));

        return NextResponse.json({ resumes: formattedResumes });
    } catch (error) {
        console.error('Error in user-resumes endpoint:', error);
        return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
    }
}
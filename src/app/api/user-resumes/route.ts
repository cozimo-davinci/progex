import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../auth/get-current-user/route';
import { prisma } from '../../lib/prisma';

export async function GET(req: NextRequest) {
    const userData = await getCurrentUser(req);
    if (!userData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = userData;
    console.log('User ID:', user.id); // Log the user ID to verify
    const userId = user.id;

    try {
        console.log('Executing resume.findMany with user_id:', userId); // Debug log
        const resumes = await prisma.resume.findMany({
            where: { userId: userId },
            select: {
                resumeKey: true,
                fileName: true,
            },
        });
        console.log('Resumes fetched:', resumes); // Debug log

        const formattedResumes = resumes.map(resume => ({
            key: resume.resumeKey,
            name: resume.fileName,
        }));

        return NextResponse.json({ resumes: formattedResumes });
    } catch (error: any) {
        console.error('Error fetching resumes:', error); // Log the full error
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
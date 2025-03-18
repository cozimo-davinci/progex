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
        console.log('Executing resume_application.findMany with user_id:', userId); // Debug log
        const applications = await prisma.resume_application.findMany({
            where: { userId: userId },
            select: {
                id: true,
                resumeKey: true,
                companyName: true,
                position: true,
                tailoredResumeKey: true,
                coverLetterKey: true,
            },
        });
        console.log('Applications fetched:', applications); // Debug log

        const formattedApplications = applications.map(app => ({
            id: app.id.toString(),
            resumeKey: app.resumeKey,
            companyName: app.companyName,
            position: app.position,
            tailoredResumeKey: app.tailoredResumeKey,
            coverLetterKey: app.coverLetterKey,
        }));

        return NextResponse.json({ applications: formattedApplications });
    } catch (error: any) {
        console.error('Error fetching job applications:', error); // Log the full error
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json({ error: 'Failed to fetch job applications' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
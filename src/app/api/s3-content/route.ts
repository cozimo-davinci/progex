import { NextRequest, NextResponse } from 'next/server';
import { getObjectFromS3 } from '../../lib/s3';
import { getCurrentUser } from '../auth/get-current-user/route';

export async function GET(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const key = req.nextUrl.searchParams.get('key');
    if (!key || typeof key !== 'string') {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    // Ensure the key belongs to the current user
    const userId = user.id;
    if (!key.startsWith(`users/${userId}/`)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
        const body = await getObjectFromS3(process.env.S3_BUCKET_NAME!, key);
        const content = await body?.transformToString('utf-8');
        return NextResponse.json({ content });
    } catch (error) {
        console.error('S3 Get Error:', error);
        return NextResponse.json({ error: 'Failed to get content' }, { status: 500 });
    }
}
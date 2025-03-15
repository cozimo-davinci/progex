import { NextRequest, NextResponse } from 'next/server';
import { getObjectFromS3 } from '../../lib/s3';
import { getCurrentUser } from '../auth/get-current-user/route';

export async function GET(req: NextRequest) {
    const userData = await getCurrentUser(req);
    console.log('User data from getCurrentUser in s3-content:', userData); // Debug log
    if (!userData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = userData;
    const userId = user.id;
    console.log('User ID in s3-content:', userId); // Debug log

    const key = req.nextUrl.searchParams.get('key');
    console.log('S3 key requested:', key); // Debug log
    if (!key || typeof key !== 'string') {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    // Ensure the key belongs to the current user
    if (!key.startsWith(`users/${userId}/`)) {
        console.log('Access denied: Key does not belong to user', { key, userId });
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
        console.log('Fetching object from S3:', { bucket: process.env.S3_BUCKET_NAME, key });
        const body = await getObjectFromS3(process.env.S3_BUCKET_NAME!, key);
        if (!body) {
            console.error('S3 object not found:', key);
            return NextResponse.json({ error: 'Object not found' }, { status: 404 });
        }
        const content = await body.transformToString('utf-8');
        console.log('Successfully fetched S3 content, length:', content.length);
        return NextResponse.json({ content });
    } catch (error: any) {
        console.error('S3 Get Error:', error || 'Unknown error');
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            if (error.name === 'NoSuchKey') {
                return NextResponse.json({ error: 'Object not found' }, { status: 404 });
            }
            if (error.$metadata?.httpStatusCode === 403) {
                return NextResponse.json({ error: 'Access denied to S3 object' }, { status: 403 });
            }
        }
        return NextResponse.json({ error: 'Failed to get content' }, { status: 500 });
    }
}
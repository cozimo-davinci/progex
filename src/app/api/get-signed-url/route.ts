import { NextRequest, NextResponse } from 'next/server';
import { getSignedS3Url } from '../../lib/s3';
import { getCurrentUser } from '../auth/get-current-user/route';

export async function GET(req: NextRequest) {
    const userData = await getCurrentUser(req);
    console.log('User data from getCurrentUser in get-signed-url:', userData); // Debug log
    if (!userData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = userData;
    const userId = user.id;
    console.log('User ID in get-signed-url:', userId); // Debug log

    const key = req.nextUrl.searchParams.get('key');
    console.log('S3 key requested for signed URL:', key); // Debug log
    if (!key || typeof key !== 'string') {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    // Ensure the key belongs to the current user
    if (!key.startsWith(`users/${userId}/`)) {
        console.log('Access denied: Key does not belong to user', { key, userId });
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
        console.log('Generating signed URL for:', { bucket: process.env.S3_BUCKET_NAME, key });
        const url = await getSignedS3Url(process.env.S3_BUCKET_NAME!, key, 3600); // Expires in 1 hour
        console.log('Signed URL generated:', url);
        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('Error generating signed URL:', error || 'Unknown error');
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            if (error.$metadata?.httpStatusCode === 403) {
                return NextResponse.json({ error: 'Access denied to S3 object' }, { status: 403 });
            }
        }
        return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }
}
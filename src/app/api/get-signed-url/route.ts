import { NextRequest, NextResponse } from 'next/server';
import { getSignedS3Url } from '../../lib/s3';
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
        const url = await getSignedS3Url(process.env.S3_BUCKET_NAME!, key, 3600); // Expires in 1 hour
        return NextResponse.json({ url });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { getSignedS3Url } from '../../lib/s3';

export async function GET(req: NextRequest) {
    const key = req.nextUrl.searchParams.get('key');
    if (!key || typeof key !== 'string') {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    try {
        const url = await getSignedS3Url(process.env.S3_BUCKET_NAME!, key, 3600); // Expires in 1 hour
        return NextResponse.json({ url });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }
}
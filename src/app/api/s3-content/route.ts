import { NextRequest, NextResponse } from 'next/server';
import { getObjectFromS3 } from '../../lib/s3';

export async function GET(req: NextRequest) {
    const key = req.nextUrl.searchParams.get('key');
    if (!key || typeof key !== 'string') {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
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
// pages/api/get-content.ts
import { NextRequest, NextResponse } from 'next/server';
import { s3 } from '../../lib/s3'; // Adjust path

export async function GET(req: NextRequest) {
    const key = req.nextUrl.searchParams.get('key');
    if (!key || typeof key !== 'string') {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    try {
        const data = await s3
            .getObject({
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: key,
            })
            .promise();
        const content = data.Body?.toString('utf-8');
        return NextResponse.json({ content });
    } catch (error) {
        console.error('S3 Get Error:', error);
        return NextResponse.json({ error: 'Failed to get content' }, { status: 500 });
    }
}
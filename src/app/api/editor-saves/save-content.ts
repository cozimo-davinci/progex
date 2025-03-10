// pages/api/save-content.ts
import { NextRequest, NextResponse } from 'next/server';
import { s3 } from '../../lib/s3'; // Adjust path

export async function POST(req: NextRequest) {
    const { key, content } = await req.json();
    if (!key || !content) {
        return NextResponse.json({ error: 'Missing key or content' }, { status: 400 });
    }

    try {
        await s3
            .putObject({
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: key,
                Body: content,
                ContentType: 'text/plain',
            })
            .promise();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('S3 Save Error:', error);
        return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '../../lib/s3'; // Import the correct function

export async function POST(req: NextRequest) {
    const { key, content } = await req.json();
    if (!key || !content) {
        console.error('Missing key or content in request:', { key, content });
        return NextResponse.json({ error: 'Missing key or content' }, { status: 400 });
    }

    try {
        console.log(`Saving content to S3 with key: ${key}`);
        await uploadToS3({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
            Body: content, // Content is a string (HTML from TipTap)
            ContentType: 'text/html', // Match the content type used in /api/ai-resume
        });
        console.log('Content saved successfully to S3');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('S3 Save Error:', error);
        return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
    }
}
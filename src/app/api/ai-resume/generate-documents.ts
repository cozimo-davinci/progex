// pages/api/generate-documents.ts
import { NextRequest, NextResponse } from 'next/server';
import { s3 } from '../../lib/s3'; // Adjust path
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    const { resumeKey, jobDescription, prompt } = await req.json();
    if (!resumeKey || !jobDescription) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mock AI pipeline (replace with actual AI service call)
    const tailoredResumeContent = `Tailored resume based on ${jobDescription} and prompt: ${prompt}`;
    const coverLetterContent = `Cover letter based on ${jobDescription} and prompt: ${prompt}`;

    const tailoredResumeKey = `tailored-resumes/${uuidv4()}.txt`;
    const coverLetterKey = `cover-letters/${uuidv4()}.txt`;

    try {
        await s3
            .putObject({
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: tailoredResumeKey,
                Body: tailoredResumeContent,
                ContentType: 'text/plain',
            })
            .promise();

        await s3
            .putObject({
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: coverLetterKey,
                Body: coverLetterContent,
                ContentType: 'text/plain',
            })
            .promise();

        return NextResponse.json({ tailoredResumeKey, coverLetterKey });
    } catch (error) {
        console.error('S3 Save Error:', error);
        return NextResponse.json({ error: 'Failed to generate documents' }, { status: 500 });
    }
}
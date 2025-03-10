// pages/api/upload-resume.ts
import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import { s3 } from '../../lib/s3'; // Adjust path to your S3 utility file
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false, // Disable default body parser for file uploads
    },
};

export async function POST(req: NextRequest) {
    const form = new formidable.IncomingForm();
    return new Promise<NextResponse>((resolve) => {
        form.parse(req, async (err, fields, files) => {
            if (err) {
                resolve(NextResponse.json({ error: 'Failed to parse form' }, { status: 500 }));
                return;
            }

            const file = files.file as formidable.File;
            if (!file) {
                resolve(NextResponse.json({ error: 'No file uploaded' }, { status: 400 }));
                return;
            }

            const fileKey = `resumes/${uuidv4()}-${file.originalFilename}`;
            const fileStream = fs.createReadStream(file.filepath);

            const params = {
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: fileKey,
                Body: fileStream,
                ContentType: file.mimetype,
            };

            try {
                await s3.upload(params).promise();
                resolve(NextResponse.json({ key: fileKey }));
            } catch (error) {
                console.error('S3 Upload Error:', error);
                resolve(NextResponse.json({ error: 'Failed to upload file' }, { status: 500 }));
            }
        });
    });
}
import { NextRequest, NextResponse } from 'next/server';
import { s3Client, uploadToS3, getSignedS3Url, listObjectsFromS3 } from '../../lib/s3';
import { Mistral } from '@mistralai/mistralai';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { Buffer } from 'buffer';
import { getCurrentUser } from '../auth/get-current-user/route';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

// Define interfaces for Mistral OCR response based on logs
interface OCRPage {
    index: number;
    markdown: string;
    images: any[];
    dimensions: { dpi: number; height: number; width: number };
}

interface OCRResponse {
    pages: OCRPage[];
    model: string;
    usageInfo: { pagesProcessed: number; docSizeBytes: number };
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Starting resume upload process...');
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('No file provided in request');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const userId = user.id;
        console.log(`User ID: ${userId}`);

        // Check for duplicate in S3
        const prefix = `users/${userId}/resumes/`;
        const objects = await listObjectsFromS3(process.env.S3_BUCKET_NAME!, prefix);
        const existingResume = objects.find(obj => obj.Key?.includes(file.name));

        if (existingResume) {
            console.log('Duplicate resume found in S3, returning existing key');
            return NextResponse.json({ key: existingResume.Key });
        }

        // Generate S3 key with user ID
        const resumeKey = `users/${userId}/resumes/${uuidv4()}-${file.name}`;
        console.log(`Generated resume key: ${resumeKey}`);

        // Upload to S3
        const fileBuffer = await file.arrayBuffer();
        const fileStream = Readable.from(Buffer.from(fileBuffer));
        console.log('Uploading original resume to S3...');
        await uploadToS3({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: resumeKey,
            Body: fileStream,
            ContentType: file.type,
        });
        console.log('Original resume uploaded successfully');

        // Generate signed URL for OCR
        console.log('Generating signed URL for OCR...');
        const s3Url = await getSignedS3Url(process.env.S3_BUCKET_NAME!, resumeKey, 3600);
        console.log(`Signed URL generated: ${s3Url}`);

        // Extract text with Mistral OCR
        const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });
        console.log('Initiating Mistral OCR processing...');
        const ocrResponse = await client.ocr.process({
            model: 'mistral-ocr-latest',
            document: {
                type: 'document_url',
                documentUrl: s3Url,
            },
        });
        console.log('Mistral OCR processing completed');
        console.log('Mistral OCR response:', JSON.stringify(ocrResponse, null, 2));

        let extractedText = '';
        if (ocrResponse && (ocrResponse as OCRResponse).pages) {
            for (const page of (ocrResponse as OCRResponse).pages) {
                if (page.markdown) {
                    extractedText += page.markdown + '\n';
                } else {
                    console.warn('No markdown found in page:', page);
                }
            }
        } else {
            console.error('Unexpected OCR response structure:', ocrResponse);
        }
        console.log(`Extracted text length: ${extractedText.length} characters`);
        console.log(`Extracted text preview: ${extractedText.substring(0, 100)}...`);

        // Upload extracted text to S3
        const extractedTextKey = `users/${userId}/extracted-resumes/${resumeKey}-extracted.txt`;
        console.log(`Uploading extracted text to S3 with key: ${extractedTextKey}`);
        await uploadToS3({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: extractedTextKey,
            Body: extractedText,
            ContentType: 'text/plain',
        });
        console.log('Extracted text uploaded successfully');

        // Store resume metadata in Supabase for easier retrieval
        const { error: insertError } = await supabase
            .from('resume')
            .insert({
                user_id: userId,
                file_name: file.name,
                resume_key: resumeKey,
                created_at: new Date().toISOString(),
            });

        if (insertError) {
            console.error('Error storing resume metadata:', insertError);
            return NextResponse.json({ error: 'Failed to store resume metadata' }, { status: 500 });
        }

        return NextResponse.json({ key: resumeKey });
    } catch (error) {
        console.error('Error in upload endpoint:', error);
        return NextResponse.json({ error: 'Failed to process resume' }, { status: 500 });
    }
}
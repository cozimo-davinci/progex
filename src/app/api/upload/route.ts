import { NextRequest, NextResponse } from 'next/server';
import { s3Client, uploadToS3, getSignedS3Url } from '../../lib/s3';
import { Mistral } from '@mistralai/mistralai';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { Buffer } from 'buffer';

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
        console.log('Starting resume upload process...');
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('No file provided in request');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const resumeKey = `resumes/${uuidv4()}-${file.name}`;
        console.log(`Generated resume key: ${resumeKey}`);

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

        console.log('Generating signed URL for OCR...');
        const s3Url = await getSignedS3Url(process.env.S3_BUCKET_NAME!, resumeKey, 3600);
        console.log(`Signed URL generated: ${s3Url}`);

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
        console.log('Mistral OCR response:', JSON.stringify(ocrResponse, null, 2)); // Log full response

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
        console.log(`Extracted text preview: ${extractedText.substring(0, 100)}...`); // Preview first 100 characters

        const extractedTextKey = `extracted-resumes/${resumeKey}-extracted.txt`;
        console.log(`Uploading extracted text to S3 with key: ${extractedTextKey}`);
        await uploadToS3({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: extractedTextKey,
            Body: extractedText, // Now works because s3.ts allows string
            ContentType: 'text/plain',
        });
        console.log('Extracted text uploaded successfully');

        return NextResponse.json({ key: resumeKey });
    } catch (error) {
        console.error('Error in upload endpoint:', error);
        return NextResponse.json({ error: 'Failed to process resume' }, { status: 500 });
    }
}
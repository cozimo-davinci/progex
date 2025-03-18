import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import htmlDocx from 'html-docx-js';
import { getObjectFromS3 } from '../../lib/s3';
import { getCurrentUser } from '../auth/get-current-user/route';

export async function POST(req: NextRequest) {
    const userData = await getCurrentUser(req);
    if (!userData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = userData;
    const userId = user.id;

    const { key, format } = await req.json();

    // Validate input
    if (!key || !format) {
        return NextResponse.json({ error: 'Missing key or format' }, { status: 400 });
    }

    // Ensure the key belongs to the current user
    if (!key.startsWith(`users/${userId}/`)) {
        console.log('Access denied: Key does not belong to user', { key, userId });
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
        const htmlBody = await getObjectFromS3(process.env.S3_BUCKET_NAME!, key);
        if (!htmlBody) {
            return NextResponse.json({ error: 'Object not found' }, { status: 404 });
        }
        const htmlString = await htmlBody.transformToString('utf-8');

        let fileBuffer: Uint8Array;
        let contentType: string;
        let fileExtension: string;

        if (format === 'pdf') {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.setContent(htmlString, { waitUntil: 'networkidle0' });
            fileBuffer = await page.pdf({ format: 'A4' }); // Returns Uint8Array
            await browser.close();
            contentType = 'application/pdf';
            fileExtension = 'pdf';
        } else if (format === 'docx') {
            // Use asBlob() and convert to Uint8Array
            const blob = htmlDocx.asBlob(htmlString) as Blob; // Explicit type assertion
            const arrayBuffer = await blob.arrayBuffer(); // Convert Blob to ArrayBuffer
            fileBuffer = new Uint8Array(arrayBuffer); // Convert to Uint8Array
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            fileExtension = 'docx';
        } else {
            return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
        }

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="document.${fileExtension}"`,
            },
        });
    } catch (error: any) {
        console.error('Error downloading document:', error);
        if (error.name === 'NoSuchKey') {
            return NextResponse.json({ error: 'Object not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
    }
}
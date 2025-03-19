import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Numbering,
    INumberingOptions,
    AlignmentType,
    UnderlineType, // Added import
} from 'docx';
import { Parser } from 'htmlparser2';
import { DomHandler, Element, Node, Text } from 'domhandler';
import { getChildren, isTag, isText } from 'domutils';
import { getObjectFromS3 } from '../../lib/s3';
import { getCurrentUser } from '../auth/get-current-user/route';

// Define a numbering style for lists
const numberingOptions: INumberingOptions = {
    config: [
        {
            reference: 'bullet-list',
            levels: [
                {
                    level: 0,
                    format: 'bullet',
                    text: '•',
                    alignment: AlignmentType.LEFT,
                    style: {
                        paragraph: {
                            indent: { left: 720, hanging: 360 },
                        },
                    },
                },
                {
                    level: 1,
                    format: 'bullet',
                    text: '◦',
                    alignment: AlignmentType.LEFT,
                    style: {
                        paragraph: {
                            indent: { left: 1440, hanging: 360 },
                        },
                    },
                },
            ],
        },
        {
            reference: 'ordered-list',
            levels: [
                {
                    level: 0,
                    format: 'decimal',
                    text: '%1.',
                    alignment: AlignmentType.LEFT,
                    style: {
                        paragraph: {
                            indent: { left: 720, hanging: 360 },
                        },
                    },
                },
                {
                    level: 1,
                    format: 'lowerLetter',
                    text: '%2.',
                    alignment: AlignmentType.LEFT,
                    style: {
                        paragraph: {
                            indent: { left: 1440, hanging: 360 },
                        },
                    },
                },
            ],
        },
    ],
};

// Interface to hold text and formatting options
interface TextRunOptions {
    text: string;
    size?: number;
    bold?: boolean;
    italics?: boolean;
    underline?: { type: (typeof UnderlineType)[keyof typeof UnderlineType] };
    color?: string;
    break?: number;
}

// Convert HTML to docx elements
function htmlToDocxElements(htmlString: string): Paragraph[] {
    const elements: Paragraph[] = [];
    let currentList: { type: 'bullet' | 'ordered'; items: Paragraph[] } | null = null;
    let listLevel = 0;

    // Log the raw HTML for debugging
    console.log('Raw HTML input:', htmlString);

    const handler = new DomHandler((error, dom) => {
        if (error) {
            console.error('Error parsing HTML:', error);
            return;
        }

        function processNode(node: Node, level: number = 0): void {
            if (isTag(node)) {
                const tag = node as Element;

                // Handle lists
                if (tag.name === 'ul' || tag.name === 'ol') {
                    if (currentList) {
                        listLevel++;
                    } else {
                        currentList = {
                            type: tag.name === 'ul' ? 'bullet' : 'ordered',
                            items: [],
                        };
                    }
                    getChildren(tag).forEach(child => processNode(child, level + 1));
                    if (listLevel === 0) {
                        elements.push(...currentList.items);
                        currentList = null;
                    } else {
                        listLevel--;
                    }
                    return;
                }

                // Handle list items
                if (tag.name === 'li' && currentList) {
                    const paragraphChildren: TextRun[] = [];
                    getChildren(tag).forEach(child => {
                        const runs = processInlineNode(child);
                        paragraphChildren.push(...runs);
                    });
                    const paragraph = new Paragraph({
                        children: paragraphChildren,
                        numbering: {
                            reference: currentList.type === 'bullet' ? 'bullet-list' : 'ordered-list',
                            level: listLevel,
                        },
                        spacing: { after: 200 }, // Add spacing after list items
                    });
                    currentList.items.push(paragraph);
                    return;
                }

                // Handle headings (h1 to h6)
                if (tag.name.match(/^h[1-6]$/)) {
                    const headingLevel = parseInt(tag.name.replace('h', '')) - 1;
                    const headingChildren: TextRun[] = [];
                    console.log(`Found heading: <${tag.name}>`, getChildren(tag).map(child => (child as Text).data).filter(Boolean).join(''));
                    getChildren(tag).forEach(child => {
                        const runs = processInlineNode(child);
                        headingChildren.push(...runs);
                    });
                    if (headingChildren.length === 0) {
                        console.log(`Skipping empty heading: <${tag.name}>`);
                        return;
                    }
                    const heading = new Paragraph({
                        children: headingChildren,
                        heading: headingLevel === 0 ? HeadingLevel.HEADING_1 :
                            headingLevel === 1 ? HeadingLevel.HEADING_2 :
                                headingLevel === 2 ? HeadingLevel.HEADING_3 :
                                    headingLevel === 3 ? HeadingLevel.HEADING_4 :
                                        headingLevel === 4 ? HeadingLevel.HEADING_5 :
                                            HeadingLevel.HEADING_6,
                        spacing: { before: 240, after: 120 },
                    });
                    elements.push(heading);
                    return;
                }

                // Handle paragraphs
                if (tag.name === 'p') {
                    const paragraphChildren: TextRun[] = [];
                    getChildren(tag).forEach(child => {
                        const runs = processInlineNode(child);
                        paragraphChildren.push(...runs);
                    });
                    if (paragraphChildren.length === 0) {
                        return;
                    }
                    const paragraph = new Paragraph({
                        children: paragraphChildren,
                        spacing: { after: 200 },
                    });
                    elements.push(paragraph);
                    return;
                }

                // Handle other block elements (e.g., div)
                if (tag.name === 'div') {
                    getChildren(tag).forEach(child => processNode(child, level));
                    return;
                }

                // Handle inline elements
                getChildren(tag).forEach(child => processNode(child, level));
            } else if (isText(node)) {
                const text = (node as Text).data.trim();
                if (text) {
                    console.log('Found stray text node:', text);
                    const paragraph = new Paragraph({
                        children: [new TextRun({
                            text,
                            size: 26,
                        })],
                        spacing: { after: 200 },
                    });
                    elements.push(paragraph);
                }
            }
        }

        function processInlineNode(node: Node, options: TextRunOptions = { text: '' }): TextRun[] {
            const runs: TextRun[] = [];

            if (isText(node)) {
                const text = (node as Text).data.trim();
                if (text) {
                    runs.push(new TextRun({
                        text,
                        size: 26,
                        bold: options.bold,
                        italics: options.italics,
                        underline: options.underline,
                        color: options.color,
                    }));
                }
                return runs;
            }

            if (isTag(node)) {
                const tag = node as Element;
                const children = getChildren(tag);

                if (tag.name === 'strong' || tag.name === 'b') {
                    children.forEach(child => {
                        const childRuns = processInlineNode(child, { ...options, bold: true });
                        runs.push(...childRuns);
                    });
                    return runs;
                }

                if (tag.name === 'em' || tag.name === 'i') {
                    children.forEach(child => {
                        const childRuns = processInlineNode(child, { ...options, italics: true });
                        runs.push(...childRuns);
                    });
                    return runs;
                }

                if (tag.name === 'u') {
                    children.forEach(child => {
                        const childRuns = processInlineNode(child, { ...options, underline: { type: 'single' } });
                        runs.push(...childRuns);
                    });
                    return runs;
                }

                if (tag.name === 'br') {
                    runs.push(new TextRun({ break: 1, size: 26 }));
                    return runs;
                }

                if (tag.name === 'a') {
                    const href = tag.attribs.href || '';
                    let linkText = '';
                    children.forEach(child => {
                        if (isText(child)) {
                            linkText += (child as Text).data.trim();
                        } else if (isTag(child)) {
                            const nestedText = getTextFromNode(child);
                            linkText += nestedText;
                        }
                    });
                    runs.push(new TextRun({
                        text: linkText || href,
                        size: 26,
                        underline: { type: 'single' },
                        color: '0000FF',
                    }));
                    return runs;
                }

                children.forEach(child => {
                    const childRuns = processInlineNode(child, options);
                    runs.push(...childRuns);
                });
            }

            return runs;
        }

        // Helper function to recursively get text from nodes
        function getTextFromNode(node: Node): string {
            if (isText(node)) {
                return (node as Text).data.trim();
            } else if (isTag(node)) {
                let text = '';
                getChildren(node).forEach(child => {
                    text += getTextFromNode(child);
                });
                return text;
            }
            return '';
        }

        dom.forEach(node => processNode(node));
    });

    const parser = new Parser(handler, { decodeEntities: true });
    parser.write(htmlString);
    parser.end();

    return elements;
}

export async function POST(req: NextRequest) {
    const userData = await getCurrentUser(req);
    if (!userData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = userData;
    const userId = user.id;

    const { key, format } = await req.json();

    if (!key || !format) {
        return NextResponse.json({ error: 'Missing key or format' }, { status: 400 });
    }

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
            fileBuffer = await page.pdf({ format: 'A4' });
            await browser.close();
            contentType = 'application/pdf';
            fileExtension = 'pdf';
        } else if (format === 'docx') {
            const docxElements = htmlToDocxElements(htmlString);
            const doc = new Document({
                numbering: numberingOptions,
                sections: [{
                    children: docxElements,
                }],
            });
            const buffer = await Packer.toBuffer(doc);
            fileBuffer = new Uint8Array(buffer);
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
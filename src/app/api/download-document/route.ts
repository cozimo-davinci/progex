import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Numbering,
    IChildElement,
    INumberingOptions,
    ILevels,
    AlignmentType,
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

// Convert HTML to docx elements
function htmlToDocxElements(htmlString: string): IChildElement[] {
    const elements: IChildElement[] = [];
    let currentList: { type: 'bullet' | 'ordered'; items: Paragraph[] } | null = null;
    let listLevel = 0;

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
                    });
                    currentList.items.push(paragraph);
                    return;
                }

                // Handle headings
                if (tag.name.match(/^h[1-6]$/)) {
                    const headingLevel = parseInt(tag.name.replace('h', '')) - 1;
                    const headingChildren: TextRun[] = [];
                    getChildren(tag).forEach(child => {
                        const runs = processInlineNode(child);
                        headingChildren.push(...runs);
                    });
                    elements.push(
                        new Paragraph({
                            children: headingChildren,
                            heading: headingLevel === 0 ? HeadingLevel.HEADING_1 :
                                headingLevel === 1 ? HeadingLevel.HEADING_2 :
                                    headingLevel === 2 ? HeadingLevel.HEADING_3 :
                                        headingLevel === 3 ? HeadingLevel.HEADING_4 :
                                            headingLevel === 4 ? HeadingLevel.HEADING_5 :
                                                HeadingLevel.HEADING_6,
                        })
                    );
                    return;
                }

                // Handle paragraphs
                if (tag.name === 'p') {
                    const paragraphChildren: TextRun[] = [];
                    getChildren(tag).forEach(child => {
                        const runs = processInlineNode(child);
                        paragraphChildren.push(...runs);
                    });
                    elements.push(
                        new Paragraph({
                            children: paragraphChildren,
                        })
                    );
                    return;
                }

                // Handle other block elements (e.g., div) by treating them as paragraphs
                if (tag.name === 'div') {
                    getChildren(tag).forEach(child => processNode(child, level));
                    return;
                }

                // Handle inline elements by processing their children
                getChildren(tag).forEach(child => processNode(child, level));
            }
        }

        function processInlineNode(node: Node): TextRun[] {
            const runs: TextRun[] = [];

            if (isText(node)) {
                const text = (node as Text).data.trim();
                if (text) {
                    runs.push(new TextRun(text));
                }
                return runs;
            }

            if (isTag(node)) {
                const tag = node as Element;
                const children = getChildren(tag);

                // Handle inline formatting
                if (tag.name === 'strong' || tag.name === 'b') {
                    children.forEach(child => {
                        const childRuns = processInlineNode(child);
                        childRuns.forEach(run => {
                            runs.push(new TextRun({ ...run, bold: true }));
                        });
                    });
                    return runs;
                }

                if (tag.name === 'em' || tag.name === 'i') {
                    children.forEach(child => {
                        const childRuns = processInlineNode(child);
                        childRuns.forEach(run => {
                            runs.push(new TextRun({ ...run, italics: true }));
                        });
                    });
                    return runs;
                }

                if (tag.name === 'u') {
                    children.forEach(child => {
                        const childRuns = processInlineNode(child);
                        childRuns.forEach(run => {
                            runs.push(new TextRun({ ...run, underline: { type: 'single' } }));
                        });
                    });
                    return runs;
                }

                // Handle line breaks
                if (tag.name === 'br') {
                    runs.push(new TextRun({ break: 1 }));
                    return runs;
                }

                // Process children of other inline tags
                children.forEach(child => {
                    const childRuns = processInlineNode(child);
                    runs.push(...childRuns);
                });
            }

            return runs;
        }

        dom.forEach(node => processNode(node));
    });

    // Parse the HTML
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
            // Convert HTML to docx elements
            const docxElements = htmlToDocxElements(htmlString);
            const doc = new Document({
                numbering: numberingOptions,
                sections: [{
                    children: docxElements,
                }],
            });
            // Generate DOCX buffer
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
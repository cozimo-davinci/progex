import { NextRequest, NextResponse } from 'next/server';
import { getObjectFromS3, uploadToS3 } from '../../lib/s3';
import { Mistral } from '@mistralai/mistralai';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    const { resumeKey, jobDescription, prompt } = await req.json();
    if (!resumeKey || !jobDescription) {
        console.error('Missing resumeKey or jobDescription in request');
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        console.log(`Starting AI resume generation for resumeKey: ${resumeKey}`);
        const extractedTextKey = `extracted-resumes/${resumeKey}-extracted.txt`;
        console.log(`Fetching extracted text from S3 with key: ${extractedTextKey}`);
        const extractedTextBody = await getObjectFromS3(process.env.S3_BUCKET_NAME!, extractedTextKey);
        const extractedText = await extractedTextBody?.transformToString('utf-8');
        if (!extractedText) {
            console.error('Extracted text not found in S3');
            throw new Error('Extracted text not found');
        }
        console.log('Extracted text fetched successfully');

        const aiPrompt = `
        You are an AI assistant specialized in resume tailoring and cover letter writing. Given the following information:

        1. Extracted resume text:
        ${extractedText}

        2. Job description:
        ${jobDescription}

        3. User's prompt:
        ${prompt}

        Please generate two documents in HTML format:

        First, a tailored resume that highlights the candidate's skills and experiences relevant to the job description, following the user's prompt.

        Second, a unique and humanized cover letter that showcases the candidate's fit for the position based on their resume and the job description. Ensure the cover letter is not generic and stands out.

        Format the response as follows:

        --- Tailored Resume ---
        <div>[HTML formatted tailored resume content]</div>

        --- Cover Letter ---
        <div>[HTML formatted cover letter content]</div>

        But make sure maintain the initial formating style of the resume, make it look seamlessly with the html format as well. Logicaly format the paragraphs where the bullet lists are needed. Add a bit of spacing between the paragraphs, so they don't overlay each other.
        `;
        console.log('Sending prompt to Mistral AI...');

        const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });
        const chatResponse = await client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: aiPrompt }],
        });
        console.log('Mistral AI response received');

        // Check choices
        if (!chatResponse.choices || chatResponse.choices.length === 0) {
            console.error('No choices found in AI response');
            throw new Error('No choices found in AI response');
        }

        const generatedText = chatResponse.choices[0].message.content;
        if (!generatedText) {
            console.error('Generated text is null or undefined');
            throw new Error('Generated text is null or undefined');
        }

        // Log the response for debugging
        console.log('Generated text:', generatedText);

        // Handle potential ContentChunk[] type
        let textToSplit: string;
        if (Array.isArray(generatedText)) {
            textToSplit = generatedText.map(chunk => chunk.toString()).join('\n');
        } else {
            textToSplit = generatedText as string;
        }

        // Flexible split
        const parts = textToSplit.split(/---\s*Cover Letter\s*---/i);
        if (parts.length < 2) {
            console.error('Failed to parse AI response into resume and cover letter', parts);
            throw new Error('Failed to parse AI response');
        }

        const tailoredResumeContent = parts[0].replace(/---\s*Tailored Resume\s*---/i, '').trim();
        const coverLetterContent = parts[1].trim();
        console.log('Generated tailored resume and cover letter content');

        const applicationId = uuidv4();
        const tailoredResumeKey = `tailored-resumes/${resumeKey}-${applicationId}.html`;
        const coverLetterKey = `cover-letters/${resumeKey}-${applicationId}.html`;

        console.log(`Uploading tailored resume to S3 with key: ${tailoredResumeKey}`);
        await uploadToS3({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: tailoredResumeKey,
            Body: tailoredResumeContent,
            ContentType: 'text/html',
        });

        console.log(`Uploading cover letter to S3 with key: ${coverLetterKey}`);
        await uploadToS3({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: coverLetterKey,
            Body: coverLetterContent,
            ContentType: 'text/html',
        });
        console.log('Both documents uploaded successfully');

        return NextResponse.json({
            resumeKey,
            tailoredResumeKey,
            coverLetterKey,
        });
    } catch (error) {
        console.error('Error in ai-resume endpoint:', error);
        return NextResponse.json({ error: 'Failed to generate documents' }, { status: 500 });
    }
}
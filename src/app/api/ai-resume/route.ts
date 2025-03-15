import { NextRequest, NextResponse } from 'next/server';
import { getObjectFromS3, uploadToS3, listObjectsFromS3 } from '../../lib/s3';
import { Mistral } from '@mistralai/mistralai';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '../auth/get-current-user/route';
import { prisma } from '../../lib/prisma';

export async function POST(req: NextRequest) {
  const userData = await getCurrentUser(req);
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = userData;
  const userId = user.id;

  const { resumeKey, jobDescription, prompt, companyName, position } = await req.json();
  if (!resumeKey || !jobDescription || !companyName || !position) {
    console.error('Missing required fields in request');
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    console.log(`Starting AI resume generation for resumeKey: ${resumeKey}`);

    // Check for duplicate tailored resume in S3
    const jobPostingFolder = `${companyName}-${position}`.replace(/\s+/g, '-').toLowerCase();
    const tailoredResumePrefix = `users/${userId}/tailored-resumes/${jobPostingFolder}/${resumeKey}`;
    const coverLetterPrefix = `users/${userId}/cover-letters/${jobPostingFolder}/${resumeKey}`;
    const tailoredResumes = await listObjectsFromS3(process.env.S3_BUCKET_NAME!, tailoredResumePrefix);
    const coverLetters = await listObjectsFromS3(process.env.S3_BUCKET_NAME!, coverLetterPrefix);

    if (tailoredResumes.length > 0 && coverLetters.length > 0) {
      console.log('Duplicate application found in S3, returning existing keys');
      return NextResponse.json({
        resumeKey,
        tailoredResumeKey: tailoredResumes[0].Key,
        coverLetterKey: coverLetters[0].Key,
      });
    }

    // Fetch extracted text
    const extractedTextKey = `users/${userId}/extracted-resumes/${resumeKey}-extracted.txt`;
    console.log(`Fetching extracted text from S3 with key: ${extractedTextKey}`);
    const extractedTextBody = await getObjectFromS3(process.env.S3_BUCKET_NAME!, extractedTextKey);
    const extractedText = await extractedTextBody?.transformToString('utf-8');
    if (!extractedText) {
      console.error('Extracted text not found in S3');
      throw new Error('Extracted text not found');
    }
    console.log('Extracted text fetched successfully');

    // Generate tailored documents using Mistral AI
    const aiPrompt = `
            You are an AI assistant specialized in resume tailoring and cover letter writing. Given the following information:
            
            1. Extracted resume text (in Markdown format):
            ${extractedText}
            
            2. Job description:
            ${jobDescription}
            
            3. User's prompt:
            ${prompt}
            
            Please generate two documents in HTML format:
            
            First, a tailored resume that highlights the candidate's skills and experiences relevant to the job description, following the user's prompt, while preserving the original resume's formatting style as described below.
            
            Second, a unique and humanized cover letter that showcases the candidate's fit for the position based on their resume and the job description. Ensure the cover letter is not generic and stands out.
            
            ### Formatting Instructions for the Tailored Resume
            
            The original resume is provided in Markdown format. Use the Markdown structure to infer the original formatting and apply the following rules to preserve its style in the HTML output:
            
            - **Headings**:
              - Convert Markdown headings to HTML headings. For example, '# OBJECTIVE' should become <h1 style="text-transform: uppercase; font-weight: bold; margin-bottom: 15px;">OBJECTIVE</h1>, and '## RELEVANT EXPERIENCE' should become <h2 style="font-weight: bold; margin-bottom: 10px;">RELEVANT EXPERIENCE</h2>.
            
            - **Contact Information**:
              - The first line of the resume should be converted to a paragraph with inline links for email and LinkedIn, separated by pipes. For example: <p>905-971-4242 | <a href="mailto:teimur.terchiev@gmail.com">teimur.terchiev@gmail.com</a> | <a href="https://www.linkedin.com/teimur-terchyyev">LinkedIn</a></p>.
            
            - **Bullet Points**:
              - Identify bullet points in the extracted text (lines starting with '- ') and convert them to HTML unordered lists. Each bullet point should be a <li> tag within a <ul> tag, with a margin-bottom of 5px for spacing. For example: <ul><li style="margin-bottom: 5px;">Strong foundation in Java, Python, Kotlin, and JavaScript.</li>...</ul>.
            
            - **Paragraphs and Spacing**:
              - Wrap each paragraph or block of text in <p> tags with a margin-bottom of 10px.
              - For sections (e.g., 'OBJECTIVE', 'HIGHLIGHTS OF QUALIFICATIONS'), wrap the entire section in a <div style="margin-bottom: 20px;"> to separate sections.
              - Ensure there are no extra <br> tags or unnecessary line breaks within the HTML output.
            
            - **Job Titles and Dates**:
              - Format job titles as <h2> tags and company/dates as <p> tags with a margin-bottom of 5px. For example: <h2 style="font-weight: bold; margin-bottom: 10px;">Mobihelp Tutor/Teacher Assistant</h2><p style="margin-bottom: 5px;">George Brown College | September 2023 - April 2025 (expected)</p>.
            
            - **Education and Additional Info**:
              - Format education entries with dates and program on separate lines, each in a <p> tag. Convert GitHub links to clickable links (e.g., <p><a href="https://github.com/cozimo-davinci">https://github.com/cozimo-davinci</a></p>).
            
            - **Links**:
              - Preserve links in their original format. If a link is presented as a raw URL (e.g., 'https://github.com/cozimo-davinci'), convert it to a clickable link with the URL as both the href and the text (e.g., <a href="https://github.com/cozimo-davinci">https://github.com/cozimo-davinci</a>).
              - For links embedded in text (e.g., 'LinkedIn' in the contact information), format them as specified in the **Contact Information** section.
            
            - **Avoid Extra Spacing**:
              - Do not add extra line breaks or spaces between elements unless specified. For example, there should be no blank lines between job titles and their descriptions or within sections.
            
            ### Output Format
            
            Provide the tailored resume and cover letter as HTML content directly, without surrounding them with triple backticks, code blocks, or any labels like "html". The response should be structured as follows:
            
            --- Tailored Resume ---
            <div>[HTML formatted tailored resume content]</div>
            
            --- Cover Letter ---
            <div>[HTML formatted cover letter content]</div>
            
            ### Additional Notes
            
            - Tailor the content to match the job description and user prompt, but preserve the structure and styling as described above.
            - For the cover letter, use a standard professional format with paragraphs, but ensure it is unique and personalized.
            - Add 5 bullet points for each project under the 'RELEVANT EXPERIENCE' section, as specified by the user.
            - Ensure the HTML output is clean, with no extraneous line breaks or excessive spacing beyond what is specified in the formatting instructions.
            `;
    console.log('Sending prompt to Mistral AI...');

    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: aiPrompt }],
    });
    console.log('Mistral AI response received');

    if (!chatResponse.choices || chatResponse.choices.length === 0) {
      console.error('No choices found in AI response');
      throw new Error('No choices found in AI response');
    }

    const generatedText = chatResponse.choices[0].message.content;
    if (!generatedText) {
      console.error('Generated text is null or undefined');
      throw new Error('Generated text is null or undefined');
    }

    console.log('Generated text:', generatedText);

    let textToSplit: string;
    if (Array.isArray(generatedText)) {
      textToSplit = generatedText.map(chunk => chunk.toString()).join('\n');
    } else {
      textToSplit = generatedText as string;
    }

    const parts = textToSplit.split(/---\s*Cover Letter\s*---/i);
    if (parts.length < 2) {
      console.error('Failed to parse AI response into resume and cover letter', parts);
      throw new Error('Failed to parse AI response');
    }

    const tailoredResumeContent = parts[0].replace(/---\s*Tailored Resume\s*---/i, '').trim();
    const coverLetterContent = parts[1].trim();
    console.log('Generated tailored resume and cover letter content');

    // Organize S3 paths by company name and position with shorter keys
    const applicationId = uuidv4();
    const tailoredResumeKey = `users/${userId}/tailored-resumes/${jobPostingFolder}/${applicationId}.html`;
    const coverLetterKey = `users/${userId}/cover-letters/${jobPostingFolder}/${applicationId}.html`;

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

    // Reconnect to Prisma to avoid timeout issues
    console.log('Reconnecting to Prisma...');
    await prisma.$connect();

    // Store application metadata in Prisma with debugging
    console.log('Storing application metadata in Prisma...');
    console.log('Data to store:', {
      user_id: userId,
      resume_key: resumeKey,
      company_name: companyName,
      position: position,
      tailored_resume_key: tailoredResumeKey,
      cover_letter_key: coverLetterKey,
      job_description: jobDescription,
      created_at: new Date().toISOString(),
    });
    const prismaResponse = await prisma.resume_application.create({
      data: {
        userId: userId,
        resumeKey: resumeKey,
        companyName: companyName,
        position: position,
        tailoredResumeKey: tailoredResumeKey,
        coverLetterKey: coverLetterKey,
        jobDescription: jobDescription,
        createdAt: new Date().toISOString(),
      },
    });
    console.log('Prisma response:', prismaResponse);

    return NextResponse.json({
      resumeKey,
      tailoredResumeKey,
      coverLetterKey,
    });
  } catch (error: any) {
    console.error('Error in ai-resume endpoint:', error || 'Unknown error');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ error: 'Failed to generate documents' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function POST(req: NextRequest) {
    const { applicationId, currentTailoredResumeContent, missingKeywords } = await req.json();

    if (!applicationId || !currentTailoredResumeContent || !missingKeywords || missingKeywords.length === 0) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const jobDescription = await redis.get(`jobDescription:${applicationId}`);
    if (!jobDescription) {
        return NextResponse.json({ error: 'No cached job description found' }, { status: 400 });
    }

    const prompt = `
You are an expert resume writer. Given the following job description, the current tailored resume, and a list of missing keywords that are important for the job, please rewrite the resume to incorporate these missing keywords in a way that makes sense and enhances the resume's relevance to the job. Ensure that the new resume is professional and well-structured.

Job Description:
${jobDescription}

Current Tailored Resume:
${currentTailoredResumeContent}

Missing Keywords:
${missingKeywords.join(', ')}

Provide only the updated resume content, without any additional text or explanations.
`;

    try {
        const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 5000,
                temperature: 0.5,
            }),
        });

        if (!mistralResponse.ok) {
            throw new Error(`Mistral API error: ${await mistralResponse.text()}`);
        }

        const data = await mistralResponse.json();
        const newResumeContent = data.choices[0].message.content.trim();

        return NextResponse.json({ newResumeContent });
    } catch (error) {
        console.error('Error in regenerating resume:', error);
        return NextResponse.json({ error: 'Failed to regenerate resume' }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function POST(req: NextRequest) {
    const { resumeContent, jobDescription, applicationId } = await req.json();

    if (!resumeContent || !jobDescription || !applicationId) {
        return NextResponse.json(
            { error: 'Resume content, job description, and application ID are required' },
            { status: 400 }
        );
    }

    // Cache the job description for 24 hours
    await redis.set(`jobDescription:${applicationId}`, jobDescription, { ex: 86400 });

    const prompt = `
Analyze the following job description and resume. Focus only on the technical requirements, skills, qualifications, and experience mentioned in the job description. Ignore any non-technical aspects such as benefits, company culture, or accommodations. Extract the key skills and keywords from the job description, then check how many are present in the resume. Return *only* a JSON object with the following structure: { "score": number, "missingKeywords": string[] }. Do not include any additional text, explanations, or formatting like backticks.

Job Description:
${jobDescription}

Resume:
${resumeContent}
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
                max_tokens: 1000,
                temperature: 0.3,
            }),
        });

        if (!mistralResponse.ok) {
            throw new Error(`Mistral API error: ${await mistralResponse.text()}`);
        }

        const data = await mistralResponse.json();
        let analysisText = data.choices[0].message.content.trim();
        analysisText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
        const analysis = JSON.parse(analysisText);

        return NextResponse.json({ score: analysis.score, missingKeywords: analysis.missingKeywords });
    } catch (error) {
        console.error('Error in credibility analysis:', error);
        return NextResponse.json(
            { error: 'Failed to analyze credibility' },
            { status: 500 }
        );
    }
}
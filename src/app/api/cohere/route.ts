import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { redis } from '@/app/lib/redis';

// Define the interface for Mistral's Chat Completions response
interface MistralResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: 'stop' | 'length' | 'content_filter' | null;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const cacheKey = `scrapingbee:${url}`;
        const cachedData = await redis.get(cacheKey);
        let data;
        if (cachedData) {
            console.log('Cache hit for URL:', url);
            data = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        } else {
            console.log('Cache miss for URL:', url);
            const params = new URLSearchParams({
                api_key: process.env.SCRAPINGBEE_API_KEY || '',
                url,
                render_js: 'true',
                wait: '5000',
                extract_rules: JSON.stringify({ text: 'body' }), // Target job description
            });

            const scrapingBeeResponse = await fetch(`https://app.scrapingbee.com/api/v1?${params.toString()}`, {
                method: 'GET',
            });
            if (!scrapingBeeResponse.ok) {
                const errorText = await scrapingBeeResponse.text();
                console.error('ScrapingBee Error:', scrapingBeeResponse.status, errorText);
                throw new Error(`Failed to fetch URL content via ScrapingBee: ${scrapingBeeResponse.status} ${errorText}`);
            }
            data = await scrapingBeeResponse.json();
            await redis.set(cacheKey, JSON.stringify(data), { ex: 86400 });
        }

        let textContent = (data.text && Array.isArray(data.text) ? data.text.join(' ') : data.text) || '';
        textContent = textContent
            .replace(/You need to enable JavaScript to run this app\./i, '')
            .replace(/This site is protected by reCAPTCHA.*$/i, '')
            .trim();

        let requestBody;
        if (!textContent || textContent.length < 10) {
            console.warn('Insufficient content after cleaning, using fallback prompt');
            const fallbackPrompt = `Extract the job title, company, and position from the URL: ${url}. Since content is unavailable, return {"jobTitle": "Unknown", "company": "Unknown", "position": "Unknown"}.`;
            requestBody = {
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that extracts information from job postings and returns it in JSON format.' },
                    { role: 'user', content: fallbackPrompt },
                ],
                max_tokens: 4096,
                temperature: 0.3,
            };
        } else {
            const maxLength = 18000;
            const cleanedText = textContent
                .replace(/Location\s+\w+|Employment Type\s+\w+\s+\w+|Department\s+\w+|Overview|Application/g, '') // Remove metadata and tab titles
                .replace(/[^\w\s.,!?']/g, '')
                .replace(/\s+/g, ' ')
                .replace(/\.+/g, '.')
                .trim();
            if (!cleanedText) {
                throw new Error('Extracted content is empty after cleaning');
            }
            const truncatedText = cleanedText.slice(0, maxLength);
            console.log('Checking the truncated text value: ==>', truncatedText);
            const prompt = `Here is a job description: ${truncatedText}. Extract the job title, company, and position. If the position is not explicitly mentioned in the description, derive it from the job title by taking the primary role and including any seniority level (e.g., 'Senior', 'Junior', 'Mid-Level') while ignoring non-seniority qualifiers like 'New Grad', 'Trainee', or similar. Examples: 'Senior Software Engineer' → position 'Senior Software Engineer'; 'Marketing Manager, Junior' → position 'Junior Marketing Manager'; 'Software Engineer, New Grad' → position 'Software Engineer'; 'Data Analyst, Trainee' → position 'Data Analyst', but still keep if it's Intern, for example: Marketing Manager, Intern -> 'Intern Marketing Manager'; Data Engineer Internship -> 'Intern Data Engineer'. Return a JSON object: {"jobTitle": "<string>", "company": "<string>", "position": "<string>"}. If any field cannot be determined, use "Unknown".`;
            requestBody = {
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that extracts information from job postings and returns it in JSON format.' },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 4096,
                temperature: 0.3,
            };
        }

        console.log('Sending Mistral Request:', JSON.stringify(requestBody, null, 2));

        const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!mistralResponse.ok) {
            const errorText = await mistralResponse.text();
            console.error('Mistral API Error:', mistralResponse.status, errorText);
            throw new Error(`Failed to fetch from Mistral API: ${mistralResponse.status} ${errorText}`);
        }

        const mistralData = await mistralResponse.json() as MistralResponse;
        const generatedText = mistralData.choices[0].message.content;

        // Clean the Mistral response to remove Markdown code block syntax
        const cleanedText = generatedText
            .replace(/```json/g, '') // Remove ```json
            .replace(/```/g, '')     // Remove ```
            .trim();                 // Remove leading/trailing whitespace

        console.log('Mistral Response:', cleanedText);
        let extractedData;
        try {
            extractedData = JSON.parse(cleanedText);
            console.log('Extracted Data:', extractedData);
        } catch (parseError) {
            console.error('Failed to parse cleaned Mistral response as JSON:', parseError, 'Cleaned text:', cleanedText);
            extractedData = { jobTitle: 'Unknown', company: 'Unknown', position: 'Unknown' };
        }

        return NextResponse.json(extractedData);
    } catch (error) {
        console.error('Error in Mistral API route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
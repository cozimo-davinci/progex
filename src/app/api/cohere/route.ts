import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Fetch rendered content using ScrapingBee with optimized parameters
        const params = new URLSearchParams({
            api_key: process.env.SCRAPINGBEE_API_KEY || '',
            url,
            render_js: 'true',
            wait: '5000',
            extract_rules: JSON.stringify({
                text: "body",
            }),
        });

        const scrapingBeeResponse = await fetch(`https://app.scrapingbee.com/api/v1?${params.toString()}`, {
            method: 'GET',
        });
        if (!scrapingBeeResponse.ok) {
            const errorText = await scrapingBeeResponse.text();
            console.error('ScrapingBee Error:', scrapingBeeResponse.status, errorText);
            throw new Error(`Failed to fetch URL content via ScrapingBee: ${scrapingBeeResponse.status} ${errorText}`);
        }
        const data = await scrapingBeeResponse.json();
        console.log('ScrapingBee Response:', data);
        let textContent = (data.text && Array.isArray(data.text) ? data.text.join(' ') : data.text) || '';

        // Clean extraneous text
        textContent = textContent
            .replace(/You need to enable JavaScript to run this app\./i, '')
            .replace(/This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply\. Powered by Ashby Privacy Policy Security Vulnerability Disclosure/i, '')
            .trim();

        // Validate text content
        if (!textContent || textContent.length < 10) {
            console.warn('Insufficient content after cleaning, using fallback prompt');
            const fallbackPrompt = `Extract the job title, company, and position from ${url}. Return {\"jobTitle\": \"Unknown\", \"company\": \"Unknown\", \"position\": \"Unknown\"} if insufficient.`;
            const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'command-r-plus',
                    messages: [
                        { role: 'system', content: 'Return responses as JSON objects only.' },
                        { role: 'user', content: fallbackPrompt },
                    ],
                    max_tokens: 4096,
                    temperature: 0.3,
                    tools: [], // Dummy tools array to satisfy potential tool expectation
                }),
            });
            if (!cohereResponse.ok) {
                const errorText = await cohereResponse.text();
                console.error('Cohere API Error (Fallback):', cohereResponse.status, errorText);
                throw new Error(`Failed to fetch from Cohere API (Fallback): ${cohereResponse.status} ${errorText}`);
            }
            const cohereData = await cohereResponse.json();
            console.log('Cohere Full Response (Fallback):', cohereData);
            const extractedText = cohereData.text;
            let extractedData;
            try {
                extractedData = JSON.parse(extractedText);
            } catch (parseError) {
                console.error('Failed to parse Cohere API response (Fallback):', parseError, 'Raw text:', extractedText);
                extractedData = { jobTitle: "Unknown", company: "Unknown", position: "Unknown" };
            }
            return NextResponse.json(extractedData);
        }

        // Clean and truncate text to fit API limits
        const maxLength = 7000;
        const cleanedText = textContent.replace(/[^\w\s.,!?']/g, '').trim();
        const truncatedText = cleanedText.slice(0, maxLength);
        const prompt = `Extract job title, company, and position. Return {\"jobTitle\": \"<string>\", \"company\": \"<string>\", \"position\": \"<string>\"} with \"Unknown\" if not found. Text:\n\n${truncatedText}`;

        // Log the request body for debugging
        const requestBody = {
            model: 'command-r-plus',
            messages: [
                { role: 'system', content: 'Return responses as JSON objects only.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 4096,
            temperature: 0.3,
            tools: [], // Dummy tools array
        };
        console.log('Cohere Request Body:', requestBody);

        // Make request to Cohere API
        const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!cohereResponse.ok) {
            const errorText = await cohereResponse.text();
            console.error('Cohere API Error:', cohereResponse.status, errorText);
            throw new Error(`Failed to fetch from Cohere API: ${cohereResponse.status} ${errorText}`);
        }

        const cohereData = await cohereResponse.json();
        console.log('Cohere Full Response:', cohereData);
        const extractedText = cohereData.text;

        let extractedData;
        try {
            extractedData = JSON.parse(extractedText);
        } catch (parseError) {
            console.error('Failed to parse Cohere API response:', parseError, 'Raw text:', extractedText);
            const jsonMatch = extractedText.match(/\{.*\}/s);
            if (jsonMatch) {
                try {
                    extractedData = JSON.parse(jsonMatch[0]);
                } catch (nestedError) {
                    console.error('Failed to parse nested JSON:', nestedError);
                    extractedData = { jobTitle: "Unknown", company: "Unknown", position: "Unknown" };
                }
            } else {
                extractedData = { jobTitle: "Unknown", company: "Unknown", position: "Unknown" };
            }
        }

        return NextResponse.json(extractedData);
    } catch (error) {
        console.error('Error in Cohere API route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
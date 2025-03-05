import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Parse the incoming request body
        const { url } = await request.json();
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Call the Grok API 
        const grokResponse = await fetch('https://api.x.ai/v1', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        // Check if the Grok API call was successful
        if (!grokResponse.ok) {
            throw new Error('Failed to fetch from Grok API');
        }

        // Parse and return the response
        const data = await grokResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in Grok API route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Forwarding request to DeepSeek:', {
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: 'POST',
      headers: request.headers,
      body
    });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API error:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      return new NextResponse(error, { status: response.status });
    }

    const data = await response.json();
    console.log('DeepSeek API response:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in DeepSeek API route:', error);
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500 }
    );
  }
} 
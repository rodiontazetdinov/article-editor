import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Инициализируем OpenAI клиент для DeepSeek
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  timeout: 45000, // 45 секунд таймаут
  maxRetries: 3, // Максимальное количество повторных попыток
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Processing DeepSeek request with body:', body);

        const completion = await openai.chat.completions.create({
          ...body,
          model: body.model || 'deepseek-chat',
        });

        console.log('DeepSeek API response:', completion);
        return NextResponse.json(completion);

  } catch (error) {
    console.error('Error in DeepSeek API route:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.toString() : undefined
      }), 
      { status: 500 }
    );
  }
} 
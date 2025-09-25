import { NextResponse } from 'next/server';
import { LLMProvider } from '@/lib/providers/config';

export async function GET() {
  try {
    // Use the default provider from environment variables or Azure OpenAI as fallback
    const defaultProvider = (process.env.DEFAULT_PROVIDER as LLMProvider) || LLMProvider.AZURE_OPENAI;

    return NextResponse.json({ defaultProvider });
  } catch (error) {
    console.error('Error fetching default provider:', error);

    return NextResponse.json(
      { error: 'Error fetching default provider' },
      { status: 500 }
    );
  }
}

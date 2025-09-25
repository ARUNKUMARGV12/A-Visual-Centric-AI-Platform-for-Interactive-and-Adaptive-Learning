import { AIGenerator, defineAI } from 'genkit';

// Configure AI with environment variables
export const ai = defineAI({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
  options: {
    temperature: 0.7,
    maxTokens: 1000,
  },
});

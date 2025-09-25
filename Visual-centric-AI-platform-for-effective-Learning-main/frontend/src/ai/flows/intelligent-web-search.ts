'use server';

/**
 * @fileOverview Intelligent web search using AI.
 *
 * - intelligentWebSearch - A function that performs intelligent web search.
 * - WebSearchInput - The input type for the intelligentWebSearch function.
 * - WebSearchOutput - The return type for the intelligentWebSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WebSearchInputSchema = z.object({
  transcribedText: z.string().describe('The transcribed text to search for.'),
});
export type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

const WebSearchOutputSchema = z.object({
  relevantInformation: z
    .string()
    .describe('The relevant information found from the search.'),
});
export type WebSearchOutput = z.infer<typeof WebSearchOutputSchema>;

export async function intelligentWebSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  return webSearchFlow(input);
}

const searchPrompt = ai.definePrompt({
  name: 'webSearchPrompt',
  input: {schema: WebSearchInputSchema},
  output: {schema: WebSearchOutputSchema},
  prompt: `Search the web for information about:\n\n{{{transcribedText}}}`,
});

const webSearchFlow = ai.defineFlow(
  {
    name: 'webSearchFlow',
    inputSchema: WebSearchInputSchema,
    outputSchema: WebSearchOutputSchema,
  },
  async input => {
    // Here we're using the Gemini model to generate a response based on the query
    const {response} = await ai.generate({
      model: 'googleai/gemini-pro',
      prompt: input.transcribedText,
    });
    
    return {
      relevantInformation: response.text || 'I could not find relevant information for your query.',
    };
  }
);

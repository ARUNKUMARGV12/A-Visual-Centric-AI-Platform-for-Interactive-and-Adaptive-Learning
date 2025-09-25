'use server';

/**
 * @fileOverview Speech-to-Text AI agent.
 *
 * - speechToText - A function that handles the speech to text process.
 * - SpeechToTextInput - The input type for the speechToText function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcribed text from the audio data.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'speechToTextPrompt',
  input: {schema: SpeechToTextInputSchema},
  output: {schema: SpeechToTextOutputSchema},
  prompt: `You are a speech-to-text transcription service. Transcribe the provided audio data to text.

Audio: {{media url=audioDataUri}}`,
});

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

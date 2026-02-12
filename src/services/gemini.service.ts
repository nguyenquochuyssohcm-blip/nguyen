import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  async generateVideo(prompt: string, imageBase64: string | null, mimeType: string | null): Promise<string> {
    try {
      const model = 'veo-2.0-generate-001';
      
      let operation;

      if (imageBase64 && mimeType) {
        operation = await this.ai.models.generateVideos({
          model: model,
          prompt: prompt,
          image: {
            imageBytes: imageBase64,
            mimeType: mimeType,
          },
          config: {
            numberOfVideos: 1
          }
        });
      } else {
        operation = await this.ai.models.generateVideos({
          model: model,
          prompt: prompt,
          config: {
            numberOfVideos: 1
          }
        });
      }

      // Poll for completion
      while (!operation.done) {
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await this.ai.operations.getVideosOperation({ operation: operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!videoUri) {
        throw new Error('No video URI returned from generation.');
      }

      // The video URI requires the API key appended to fetch the actual content
      const finalUrl = `${videoUri}&key=${process.env['API_KEY']}`;
      
      // We fetch it to ensure it's accessible (and to potentially blob it if needed, but direct URL usually works for video tags if authorized)
      // However, for <video src="...">, appending the key is usually sufficient for Google Cloud storage links signed this way.
      return finalUrl;

    } catch (error) {
      console.error('Video generation failed:', error);
      throw error;
    }
  }
}
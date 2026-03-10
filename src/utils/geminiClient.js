import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiClient {
  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY_A || process.env.GOOGLE_API_KEY_B || process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = null;
  }

  /**
   * Initialize the Gemini model
   */
  getModel(modelName = 'gemini-1.5-flash') {
    if (!this.model) {
      this.model = this.genAI.getGenerativeModel({ model: modelName });
    }
    return this.model;
  }

  /**
   * Generate content from text
   */
  async generateContent(prompt, modelName = 'gemini-1.5-flash') {
    try {
      const model = this.getModel(modelName);
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate content from Gemini');
    }
  }

  /**
   * Generate content with streaming
   */
  async generateContentStream(prompt, modelName = 'gemini-1.5-flash') {
    try {
      const model = this.getModel(modelName);
      const result = await model.generateContentStream(prompt);
      return result;
    } catch (error) {
      console.error('Gemini streaming error:', error);
      throw new Error('Failed to stream content from Gemini');
    }
  }

  /**
   * Summarize text
   */
  async summarize(text, options = {}) {
    const { maxLength = 100, title = '' } = options;
    
    const prompt = `Please provide a concise summary${maxLength ? ` (max ${maxLength} words)` : ''} of the following${title ? ` note titled "${title}"` : ''}:\n\n${text.slice(0, 10000)}`;
    
    return await this.generateContent(prompt);
  }

  /**
   * Generate tags from text
   */
  async generateTags(text, maxTags = 5) {
    const prompt = `Analyze the following text and suggest ${maxTags} relevant tags (single words or short phrases, comma-separated, no explanations):\n\n${text.slice(0, 5000)}`;
    
    const response = await this.generateContent(prompt);
    
    return response
      .split(',')
      .map((tag) => tag.trim().replace(/[#*]/g, ''))
      .filter((tag) => tag.length > 0 && tag.length < 30)
      .slice(0, maxTags);
  }
}

export const geminiClient = new GeminiClient();
export default geminiClient;

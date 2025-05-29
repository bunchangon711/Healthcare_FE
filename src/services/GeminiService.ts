import { GoogleGenerativeAI } from '@google/generative-ai';

// Get your API key from environment variables
// For development/testing only - replace with proper environment variable in production
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyDbVD30Ttaeuf4wYGiv-JkhsPg2wpvswdM';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);

// Configure model and parameters
const modelName = 'gemini-1.5-pro';
const systemPrompt = `
You are an AI medical assistant developed by MedCare. Your purpose is to provide helpful information on healthcare topics.

Guidelines:
1. You can answer questions about symptoms, general health advice, and wellness information.
2. You must refuse to answer any questions not related to healthcare or medical topics.
3. Always clarify that you are an AI assistant and not a real doctor.
4. Recommend consulting with a healthcare professional for personalized medical advice.
5. Do not diagnose specific conditions or prescribe treatments.
6. Be empathetic, clear, and concise in your responses.
7. For non-healthcare questions, politely explain that you can only discuss health-related topics.

Remember: Your goal is to be helpful with healthcare information while maintaining appropriate boundaries.
`;

// Simple cache implementation
interface CacheItem {
  response: string;
  timestamp: number;
}

const responseCache = new Map<string, CacheItem>();
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour in milliseconds

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

export const GeminiService = {
  async getResponse(userInput: string): Promise<string> {
    try {
      // Check if API key is available
      if (!API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      // Check cache first
      const cacheKey = userInput.toLowerCase().trim();
      const cachedItem = responseCache.get(cacheKey);
      
      if (cachedItem && (Date.now() - cachedItem.timestamp) < CACHE_EXPIRY) {
        console.log('Using cached response');
        return cachedItem.response;
      }

      // Apply rate limiting
      const now = Date.now();
      const timeElapsed = now - lastRequestTime;
      
      if (timeElapsed < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeElapsed;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      lastRequestTime = Date.now();

      // Initialize the model
      const model = genAI.getGenerativeModel({ model: modelName });

      // Create chat session
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      // Send message and get response
      const result = await chat.sendMessage(userInput);
      const response = result.response.text();
      
      // Cache the response
      responseCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      });
      
      return response;
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      
      // Check for rate limit errors
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        return 'I apologize, but we\'ve reached the request limit for our AI service. Please try again in a few minutes.';
      }
      
      return 'I apologize, but I encountered an error. Please try again later.';
    }
  }
};

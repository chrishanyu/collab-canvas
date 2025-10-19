/**
 * OpenAI Client Configuration
 * Centralized OpenAI setup
 */

import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration constants
export const AI_CONFIG = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.3,
  maxTokens: 500,
} as const;


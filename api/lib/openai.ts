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
  model: 'gpt-5', // Latest model for tool calling
  reasoning_effort: 'low',
} as const;

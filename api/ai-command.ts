/**
 * Vercel Serverless Function: AI Command Processing
 * 
 * This function:
 * 1. Verifies Firebase authentication
 * 2. Calls OpenAI GPT-4 Turbo with function calling
 * 3. Returns function calls to be executed on the frontend
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { SYSTEM_PROMPT, FUNCTION_SCHEMAS } from '../src/utils/aiPrompts';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting: Simple in-memory store (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

/**
 * Check rate limit for a user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    // Reset rate limit
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Verify Firebase Auth token
 * For MVP: Basic validation of token presence
 * For production: Use Firebase Admin SDK to verify token
 */
async function verifyAuthToken(authHeader: string | undefined): Promise<{ valid: boolean; userId?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.substring(7);
  
  // TODO: In production, verify with Firebase Admin SDK
  // const admin = require('firebase-admin');
  // const decodedToken = await admin.auth().verifyIdToken(token);
  // return { valid: true, userId: decodedToken.uid };

  // For MVP: Accept any Bearer token and extract userId from request body
  return { valid: true, userId: 'temp' };
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // 1. Verify authentication
    const authResult = await verifyAuthToken(req.headers.authorization);
    if (!authResult.valid) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing authentication token' });
    }

    // 2. Parse request body
    const { command, canvasId, userId, canvasState } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Invalid request: command is required' });
    }

    if (!canvasId || typeof canvasId !== 'string') {
      return res.status(400).json({ error: 'Invalid request: canvasId is required' });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid request: userId is required' });
    }

    // 3. Check rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait a moment before trying again.',
        retryAfter: 60 
      });
    }

    // 4. Call OpenAI with function calling
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: command },
    ];

    // Add canvas state as context if provided
    if (canvasState && canvasState.shapes && canvasState.shapes.length > 0) {
      messages.push({
        role: 'system',
        content: `Current canvas state: ${canvasState.shapes.length} shapes present. ${JSON.stringify(canvasState.shapes.slice(0, 5))}`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      functions: FUNCTION_SCHEMAS,
      function_call: 'auto',
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 500,
    });

    const responseMessage = completion.choices[0]?.message;

    if (!responseMessage) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // 5. Parse function calls
    const functionCalls: Array<{ name: string; arguments: Record<string, any> }> = [];

    if (responseMessage.function_call) {
      try {
        const args = JSON.parse(responseMessage.function_call.arguments);
        functionCalls.push({
          name: responseMessage.function_call.name,
          arguments: args,
        });
      } catch (parseError) {
        console.error('Error parsing function arguments:', parseError);
        return res.status(500).json({ error: 'Invalid function call arguments from AI' });
      }
    }

    // If no function calls, return error
    if (functionCalls.length === 0) {
      return res.status(400).json({ 
        error: 'Could not understand the command. Please try rephrasing.',
        suggestion: 'Try commands like "create a red circle" or "make a blue rectangle"'
      });
    }

    // 6. Return function calls to frontend for execution
    const executionTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      functionCalls,
      executionTime,
    });

  } catch (error: any) {
    console.error('AI Command Error:', error);

    // Handle OpenAI API errors
    if (error.status === 429) {
      return res.status(429).json({ error: 'AI service is busy. Please try again in a moment.' });
    }

    if (error.status === 401) {
      return res.status(500).json({ error: 'AI service configuration error' });
    }

    // Handle timeout
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'AI service timeout. Please try again.' });
    }

    // Generic error
    return res.status(500).json({ 
      error: 'An error occurred processing your command',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


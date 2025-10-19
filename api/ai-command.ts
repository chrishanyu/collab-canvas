/**
 * Vercel Serverless Function: AI Command Processing
 * 
 * Main API endpoint that:
 * 1. Verifies Firebase authentication
 * 2. Checks rate limits
 * 3. Calls OpenAI GPT-4 Turbo with function calling
 * 4. Returns function calls to be executed on the frontend
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { openai, AI_CONFIG } from './lib/openai.js';
import { SYSTEM_PROMPT } from './lib/prompts.js';
import { TOOLS } from './lib/schemas.js';
import { verifyAuthToken } from './lib/auth.js';
import { checkRateLimit } from './lib/rateLimit.js';

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
      return res.status(401).json({ 
        error: 'Unauthorized: Invalid or missing authentication token' 
      });
    }

    // 2. Parse and validate request body
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

    // 4. Build messages for OpenAI
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

    // 5. Call OpenAI (Modern Tools API)
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
    });

    const responseMessage = completion.choices[0]?.message;

    if (!responseMessage) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // 6. Parse tool calls (supports multiple calls in one response!)
    const functionCalls: Array<{ name: string; arguments: Record<string, unknown> }> = [];

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type === 'function') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            functionCalls.push({
              name: toolCall.function.name,
              arguments: args,
            });
          } catch (parseError) {
            console.error('Error parsing tool call arguments:', parseError);
            return res.status(500).json({ error: 'Invalid tool call arguments from AI' });
          }
        }
      }
    }

    // If no function calls, return error
    if (functionCalls.length === 0) {
      return res.status(400).json({ 
        error: 'Could not understand the command. Please try rephrasing.',
        suggestion: 'Try commands like "create a red circle" or "make a blue rectangle"'
      });
    }

    // 7. Return success response
    const executionTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      functionCalls,
      executionTime,
    });

  } catch (error: unknown) {
    console.error('AI Command Error:', error);

    // Handle OpenAI API errors
    const err = error as { status?: number; code?: string; message?: string };
    
    if (err.status === 429) {
      return res.status(429).json({ error: 'AI service is busy. Please try again in a moment.' });
    }

    if (err.status === 401) {
      return res.status(500).json({ error: 'AI service configuration error' });
    }

    // Handle timeout
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'AI service timeout. Please try again.' });
    }

    // Generic error
    return res.status(500).json({ 
      error: 'An error occurred processing your command',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}


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
  // Set CORS headers to allow requests from localhost (dev) and production
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://collab-canvas-kohl.vercel.app',
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
      const selectedShapeIds = canvasState.selectedShapeIds || [];
      
      // ALWAYS include selected shapes + recent shapes (up to 20 total)
      let shapesToSend: any[] = [];
      
      if (selectedShapeIds.length > 0) {
        // Include all selected shapes (they are the primary target!)
        const selectedShapes = canvasState.shapes.filter((s: any) => 
          selectedShapeIds.includes(s.id)
        );
        shapesToSend.push(...selectedShapes);
        
        // Add recent shapes not already selected (up to 20 total)
        const recentShapes = canvasState.shapes
          .slice(-20)
          .filter((s: any) => !selectedShapeIds.includes(s.id));
        
        const remainingSpace = 20 - shapesToSend.length;
        if (remainingSpace > 0) {
          shapesToSend.push(...recentShapes.slice(-remainingSpace));
        }
      } else {
        // No selection - just send last 20 shapes
        shapesToSend = canvasState.shapes.slice(-20);
      }
      
      let contextMessage = `Current canvas state:\n`;
      contextMessage += `- Total shapes: ${canvasState.shapes.length}\n`;
      
      // Calculate and add viewport center information
      if (canvasState.viewport) {
        const { x, y, scale, width, height } = canvasState.viewport;
        // Convert viewport center from screen coordinates to canvas coordinates
        const viewportCenterX = Math.round((width / 2 - x) / scale);
        const viewportCenterY = Math.round((height / 2 - y) / scale);
        contextMessage += `- 📍 USER'S VIEWPORT CENTER: (${viewportCenterX}, ${viewportCenterY}) ← Use this for new shape positions!\n`;
        contextMessage += `- Viewport zoom: ${Math.round(scale * 100)}%\n`;
      }
      
      if (selectedShapeIds.length > 0) {
        contextMessage += `- ⚠️ USER HAS SELECTED ${selectedShapeIds.length} SHAPE(S) - THESE ARE YOUR ONLY TARGET!\n`;
        contextMessage += `- Selected IDs: ${selectedShapeIds.join(', ')}\n`;
        contextMessage += `- 🎯 For manipulation commands: Use ONLY these selected shapes!\n`;
      } else {
        contextMessage += `- No shapes selected\n`;
        contextMessage += `- ✅ CREATION commands work fine (createShape, createGrid, etc.)\n`;
        contextMessage += `- ⚠️ MANIPULATION commands need selection (move, resize, color, delete, arrange)\n`;
      }
      
      contextMessage += `\nShapes visible to you:\n`;
      
      shapesToSend.forEach((shape: any, index: number) => {
        const isSelected = selectedShapeIds.includes(shape.id);
        contextMessage += `${index + 1}. ${shape.type} (id: ${shape.id})${isSelected ? ' ⭐[SELECTED]⭐' : ''} - pos: (${shape.x}, ${shape.y}), size: ${shape.width}x${shape.height}, color: ${shape.fill}${shape.text ? `, text: "${shape.text}"` : ''}\n`;
      });
      
      console.log('[AI-DEBUG] Canvas state sent to AI:', contextMessage);
      
      messages.push({
        role: 'system',
        content: contextMessage,
      });
    }

    // 5. Call OpenAI (Modern Tools API)
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      reasoning_effort: AI_CONFIG.reasoning_effort,
    });

    const responseMessage = completion.choices[0]?.message;

    if (!responseMessage) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    console.log('[AI-DEBUG] AI Response tool calls:', JSON.stringify(responseMessage.tool_calls, null, 2));

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

    console.log('[AI-DEBUG] Parsed function calls:', JSON.stringify(functionCalls, null, 2));

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


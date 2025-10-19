/**
 * AI Service: API Communication Layer
 * 
 * Handles communication with the Vercel serverless function (/api/ai-command)
 * API key stays secure on the backend
 */

import { auth } from './firebase';
import type { AICommandRequest, AICommandResponse } from '../types/ai';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const AI_COMMAND_ENDPOINT = `${API_BASE_URL}/api/ai-command`;
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Send AI command to backend for processing
 */
export async function sendAICommand(
  command: string,
  canvasId: string,
  userId: string,
  canvasState?: AICommandRequest['canvasState']
): Promise<AICommandResponse> {
  try {
    // Get Firebase auth token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await currentUser.getIdToken();

    // Create request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    console.log('[AI Service] Sending request to:', AI_COMMAND_ENDPOINT);
    console.log('[AI Service] Command:', command);

    const response = await fetch(AI_COMMAND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        command,
        canvasId,
        userId,
        canvasState,
      } as AICommandRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[AI Service] Response status:', response.status);

    // Handle non-200 responses
    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        console.log('[AI Service] Error response:', text);
        errorData = JSON.parse(text);
      } catch (parseError) {
        console.error('[AI Service] Failed to parse error response');
        errorData = { error: `Server error (${response.status})` };
      }
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (response.status === 404) {
        throw new Error('AI endpoint not found. Please check deployment.');
      }
      
      if (response.status === 429) {
        throw new Error(errorData.error || 'Rate limit exceeded. Please wait a moment.');
      }
      
      if (response.status === 504) {
        throw new Error('AI service timeout. Please try again.');
      }
      
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data: AICommandResponse = await response.json();
    return data;

  } catch (error: unknown) {
    // Handle fetch errors
    const err = error as { name?: string; message?: string };
    
    if (err.name === 'AbortError') {
      throw new Error('Request timeout. AI service is taking too long to respond.');
    }

    if (err.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Test OpenAI connectivity
 */
export async function testAIService(): Promise<boolean> {
  try {
    const response = await sendAICommand(
      'test',
      'test-canvas',
      'test-user'
    );
    return response.success;
  } catch (error) {
    console.error('[AI Service] Test failed:', error);
    return false;
  }
}


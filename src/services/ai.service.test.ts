/**
 * Unit Tests for AI Service
 * 
 * Tests API communication, error handling, and response parsing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendAICommand, testAIService } from './ai.service';
import { auth } from './firebase';
import type { AICommandResponse } from '../types/ai';

// Mock Firebase auth
vi.mock('./firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Service', () => {
  const mockToken = 'mock-firebase-token-123';
  const mockCanvasId = 'test-canvas-id';
  const mockUserId = 'test-user-id';
  const mockCommand = 'Create a red circle';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticated user
    (auth as any).currentUser = {
      getIdToken: vi.fn().mockResolvedValue(mockToken),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendAICommand', () => {
    it('should successfully send command and return response', async () => {
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: {
              type: 'circle',
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              color: '#FF0000',
            },
          },
        ],
        executionTime: 1234,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await sendAICommand(mockCommand, mockCanvasId, mockUserId);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai-command'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          },
          body: JSON.stringify({
            command: mockCommand,
            canvasId: mockCanvasId,
            userId: mockUserId,
            canvasState: undefined,
          }),
        })
      );
    });

    it('should include canvas state in request when provided', async () => {
      const canvasState = {
        shapes: [
          { id: '1', type: 'circle', x: 0, y: 0, width: 100, height: 100, fill: '#FF0000' },
        ],
        selectedShapeIds: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, functionCalls: [] }),
      });

      await sendAICommand(mockCommand, mockCanvasId, mockUserId, canvasState);

      const fetchCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchCallBody.canvasState).toEqual(canvasState);
    });

    it('should throw error when user is not authenticated', async () => {
      (auth as any).currentUser = null;

      await expect(
        sendAICommand(mockCommand, mockCanvasId, mockUserId)
      ).rejects.toThrow('User not authenticated');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle 401 authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: 'Unauthorized' }),
      });

      await expect(
        sendAICommand(mockCommand, mockCanvasId, mockUserId)
      ).rejects.toThrow('Authentication failed. Please log in again.');
    });

    it('should handle 404 endpoint not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: 'Not found' }),
      });

      await expect(
        sendAICommand(mockCommand, mockCanvasId, mockUserId)
      ).rejects.toThrow('AI endpoint not found. Please check deployment.');
    });

    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ error: 'Too many requests' }),
      });

      await expect(
        sendAICommand(mockCommand, mockCanvasId, mockUserId)
      ).rejects.toThrow('Too many requests');
    });

    it('should handle 504 timeout error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 504,
        text: async () => JSON.stringify({ error: 'Gateway timeout' }),
      });

      await expect(
        sendAICommand(mockCommand, mockCanvasId, mockUserId)
      ).rejects.toThrow('AI service timeout. Please try again.');
    });

    it('should handle generic server error with status code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: 'Internal server error' }),
      });

      await expect(
        sendAICommand(mockCommand, mockCanvasId, mockUserId)
      ).rejects.toThrow('Internal server error');
    });

    it('should handle server error with invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Not JSON',
      });

      await expect(
        sendAICommand(mockCommand, mockCanvasId, mockUserId)
      ).rejects.toThrow('Server error (500)');
    });

    it('should handle network error (Failed to fetch)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(
        sendAICommand(mockCommand, mockCanvasId, mockUserId)
      ).rejects.toThrow('Network error. Please check your connection.');
    });

    it('should handle request timeout (AbortError)', async () => {
      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(
        sendAICommand(mockCommand, mockCanvasId, mockUserId)
      ).rejects.toThrow('Request timeout. AI service is taking too long to respond.');
    });

    it('should set up timeout for request', async () => {
      // This test verifies that the fetch is called with an abort signal
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, functionCalls: [] }),
      });

      await sendAICommand(mockCommand, mockCanvasId, mockUserId);

      // Verify fetch was called with signal parameter
      expect(mockFetch).toHaveBeenCalled();
      const fetchOptions = mockFetch.mock.calls[0][1];
      expect(fetchOptions).toHaveProperty('signal');
      expect(fetchOptions.signal).toBeDefined();
    });

    it('should get Firebase auth token before making request', async () => {
      const getIdTokenMock = vi.fn().mockResolvedValue(mockToken);
      (auth as any).currentUser = {
        getIdToken: getIdTokenMock,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, functionCalls: [] }),
      });

      await sendAICommand(mockCommand, mockCanvasId, mockUserId);

      expect(getIdTokenMock).toHaveBeenCalledTimes(1);
    });

    it('should parse and return AI response with function calls', async () => {
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: { type: 'rectangle', x: 100, y: 200, width: 50, height: 50, color: 'blue' },
          },
          {
            name: 'createShape',
            arguments: { type: 'circle', x: 300, y: 400, width: 75, height: 75, color: 'green' },
          },
        ],
        executionTime: 2500,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await sendAICommand(mockCommand, mockCanvasId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.functionCalls).toHaveLength(2);
      expect(result.functionCalls?.[0].name).toBe('createShape');
      expect(result.functionCalls?.[1].name).toBe('createShape');
      expect(result.executionTime).toBe(2500);
    });
  });

  describe('testAIService', () => {
    it('should return true when AI service responds successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, functionCalls: [] }),
      });

      const result = await testAIService();

      expect(result).toBe(true);
    });

    it('should return false when AI service fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: 'Server error' }),
      });

      const result = await testAIService();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await testAIService();

      expect(result).toBe(false);
    });
  });
});


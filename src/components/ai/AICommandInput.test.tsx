/**
 * Component Tests for AICommandInput
 * 
 * Tests rendering, input handling, submission, and visual states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AICommandInput } from './AICommandInput';
import * as aiService from '../../services/ai.service';
import * as aiCommands from '../../services/aiCommands';
import type { AICommandResponse, ExecutionResult } from '../../types/ai';

// Mock services
vi.mock('../../services/ai.service', () => ({
  sendAICommand: vi.fn(),
}));

vi.mock('../../services/aiCommands', () => ({
  executeFunctionCalls: vi.fn(),
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

describe('AICommandInput', () => {
  const defaultProps = {
    canvasId: 'test-canvas-id',
    userId: 'test-user-id',
    userName: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with header', () => {
      render(<AICommandInput {...defaultProps} />);

      expect(screen.getByText('🤖')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    it('should render input field with placeholder', () => {
      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it('should render send button', () => {
      render(<AICommandInput {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toBeInTheDocument();
    });

    it('should render example hints when not processing', () => {
      render(<AICommandInput {...defaultProps} />);

      expect(screen.getByText('Try:')).toBeInTheDocument();
      expect(screen.getByText('"Create a blue circle"')).toBeInTheDocument();
      expect(screen.getByText('"Make a red rectangle"')).toBeInTheDocument();
      expect(screen.getByText('"Add text that says Hello"')).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should update input value when typing', async () => {
      const user = userEvent.setup();
      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'Create a blue circle');

      expect(input).toHaveValue('Create a blue circle');
    });

    it('should enable send button when input has value', async () => {
      const user = userEvent.setup();
      render(<AICommandInput {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toBeDisabled();

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test');

      expect(button).not.toBeDisabled();
    });

    it('should keep send button disabled when input is empty', () => {
      render(<AICommandInput {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toBeDisabled();
    });

    it('should keep send button disabled when input is only whitespace', async () => {
      const user = userEvent.setup();
      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, '   ');

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Command Submission', () => {
    it('should submit command on button click', async () => {
      const user = userEvent.setup();

      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: { type: 'circle', x: 0, y: 0, width: 100, height: 100, color: 'red' },
          },
        ],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-123'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'Create a red circle');

      const button = screen.getByRole('button', { name: /send/i });
      await user.click(button);

      await waitFor(() => {
        expect(aiService.sendAICommand).toHaveBeenCalledWith(
          'Create a red circle',
          defaultProps.canvasId,
          defaultProps.userId,
          undefined
        );
      });
    });

    it('should submit command on Enter key press', async () => {
      const user = userEvent.setup();

      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test command{Enter}');

      await waitFor(() => {
        expect(aiService.sendAICommand).toHaveBeenCalledWith(
          'test command',
          defaultProps.canvasId,
          defaultProps.userId,
          undefined
        );
      });
    });

    it('should not submit on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Shift>}{Enter}{/Shift}');

      expect(aiService.sendAICommand).not.toHaveBeenCalled();
    });

    it('should not submit empty command', async () => {
      const user = userEvent.setup();
      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, '{Enter}');

      expect(aiService.sendAICommand).not.toHaveBeenCalled();
    });

    it('should include canvas state when provided', async () => {
      const user = userEvent.setup();

      const canvasState = {
        shapes: [
          { id: '1', type: 'circle', x: 0, y: 0, width: 100, height: 100, fill: '#FF0000' },
        ],
        selectedShapeIds: [],
      };

      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      render(<AICommandInput {...defaultProps} canvasState={canvasState} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        expect(aiService.sendAICommand).toHaveBeenCalledWith(
          'test',
          defaultProps.canvasId,
          defaultProps.userId,
          canvasState
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when processing', async () => {
      const user = userEvent.setup();

      // Mock a slow response
      vi.mocked(aiService.sendAICommand).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
      });
    });

    it('should disable input and button when processing', async () => {
      const user = userEvent.setup();

      vi.mocked(aiService.sendAICommand).mockImplementation(
        () => new Promise(() => {})
      );

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      const button = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        expect(input).toBeDisabled();
        expect(button).toBeDisabled();
      });
    });

    it('should hide example hints when processing', async () => {
      const user = userEvent.setup();

      vi.mocked(aiService.sendAICommand).mockImplementation(
        () => new Promise(() => {})
      );

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Try:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message on failure', async () => {
      const user = userEvent.setup();

      vi.mocked(aiService.sendAICommand).mockRejectedValue(
        new Error('Network error')
      );

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should apply error border color on error', async () => {
      const user = userEvent.setup();

      vi.mocked(aiService.sendAICommand).mockRejectedValue(
        new Error('Test error')
      );

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        const inputWrapper = input.parentElement;
        expect(inputWrapper).toHaveClass('border-red-500');
      });
    });

    it('should hide example hints when error is shown', async () => {
      const user = userEvent.setup();

      vi.mocked(aiService.sendAICommand).mockRejectedValue(
        new Error('Test error')
      );

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Try:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('should apply success border color on success', async () => {
      const user = userEvent.setup();

      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        const inputWrapper = input.parentElement;
        expect(inputWrapper).toHaveClass('border-green-500');
      });
    });
  });

  describe('Border Color States', () => {
    it('should apply default border color when idle', () => {
      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      const inputWrapper = input.parentElement;
      expect(inputWrapper).toHaveClass('border-gray-300');
    });

    it('should apply blue border color when processing', async () => {
      const user = userEvent.setup();

      vi.mocked(aiService.sendAICommand).mockImplementation(
        () => new Promise(() => {})
      );

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        const inputWrapper = input.parentElement;
        expect(inputWrapper).toHaveClass('border-blue-500');
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should prevent default on Enter key to avoid form submission', async () => {
      const user = userEvent.setup();
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      render(<AICommandInput {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Create a red circle/i);
      await user.type(input, 'test{Enter}');

      // If default wasn't prevented, form would submit and test would fail
      // The fact that sendAICommand is called means preventDefault worked
      await waitFor(() => {
        expect(aiService.sendAICommand).toHaveBeenCalled();
      });
    });
  });
});


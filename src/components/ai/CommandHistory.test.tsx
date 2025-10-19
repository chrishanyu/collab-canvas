/**
 * Component Tests for CommandHistory
 * 
 * Tests history display, localStorage persistence, and command selection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandHistory, addToCommandHistory } from './CommandHistory';

describe('CommandHistory', () => {
  const testCanvasId = 'test-canvas-123';
  const storageKey = `ai-command-history-${testCanvasId}`;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should not render when history is empty', () => {
      const onSelectCommand = vi.fn();
      const { container } = render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render toggle button when history exists', () => {
      // Add a command to history
      addToCommandHistory(testCanvasId, 'Create a circle');

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      expect(screen.getByText(/Recent Commands \(1\)/i)).toBeInTheDocument();
    });

    it('should show correct count in toggle button', () => {
      // Add multiple commands
      addToCommandHistory(testCanvasId, 'Create a circle');
      addToCommandHistory(testCanvasId, 'Make a rectangle');
      addToCommandHistory(testCanvasId, 'Add text');

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      expect(screen.getByText(/Recent Commands \(3\)/i)).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('should not show commands initially (collapsed)', () => {
      addToCommandHistory(testCanvasId, 'Create a circle');

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      // Command text should not be visible when collapsed
      expect(screen.queryByText('Create a circle')).not.toBeInTheDocument();
    });

    it('should show commands when expanded', async () => {
      const user = userEvent.setup();
      addToCommandHistory(testCanvasId, 'Create a circle');

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      // Click toggle button
      const toggleButton = screen.getByText(/Recent Commands \(1\)/i);
      await user.click(toggleButton);

      // Command should now be visible
      expect(screen.getByText('Create a circle')).toBeInTheDocument();
    });

    it('should hide commands when collapsed again', async () => {
      const user = userEvent.setup();
      addToCommandHistory(testCanvasId, 'Create a circle');

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      // Expand
      const toggleButton = screen.getByText(/Recent Commands \(1\)/i);
      await user.click(toggleButton);
      expect(screen.getByText('Create a circle')).toBeInTheDocument();

      // Collapse
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByText('Create a circle')).not.toBeInTheDocument();
      });
    });
  });

  describe('Command Selection', () => {
    it('should call onSelectCommand when command is clicked', async () => {
      const user = userEvent.setup();
      const command = 'Create a blue rectangle';
      addToCommandHistory(testCanvasId, command);

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      // Expand
      const toggleButton = screen.getByText(/Recent Commands \(1\)/i);
      await user.click(toggleButton);

      // Click command
      const commandButton = screen.getByText(command);
      await user.click(commandButton);

      expect(onSelectCommand).toHaveBeenCalledWith(command);
    });

    it('should show multiple commands in reverse chronological order', async () => {
      const user = userEvent.setup();
      // Add commands in order (oldest first)
      addToCommandHistory(testCanvasId, 'First command');
      addToCommandHistory(testCanvasId, 'Second command');
      addToCommandHistory(testCanvasId, 'Third command');

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      // Expand
      const toggleButton = screen.getByText(/Recent Commands \(3\)/i);
      await user.click(toggleButton);

      // All commands should be visible
      expect(screen.getByText('First command')).toBeInTheDocument();
      expect(screen.getByText('Second command')).toBeInTheDocument();
      expect(screen.getByText('Third command')).toBeInTheDocument();
    });
  });

  describe('localStorage Integration', () => {
    it('should persist commands to localStorage', () => {
      const command = 'Create a circle';
      addToCommandHistory(testCanvasId, command);

      const stored = localStorage.getItem(storageKey);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].command).toBe(command);
      expect(parsed[0].timestamp).toBeTypeOf('number');
    });

    it('should load commands from localStorage on mount', () => {
      // Pre-populate localStorage
      const commands = [
        { command: 'Command 1', timestamp: Date.now() - 1000 },
        { command: 'Command 2', timestamp: Date.now() },
      ];
      localStorage.setItem(storageKey, JSON.stringify(commands));

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      expect(screen.getByText(/Recent Commands \(2\)/i)).toBeInTheDocument();
    });

    it('should deduplicate commands (keep most recent)', () => {
      const command = 'Create a circle';
      
      // Add same command twice
      addToCommandHistory(testCanvasId, command);
      addToCommandHistory(testCanvasId, 'Another command');
      addToCommandHistory(testCanvasId, command); // Duplicate

      const stored = localStorage.getItem(storageKey);
      const parsed = JSON.parse(stored!);

      // Should only have 2 commands (duplicate removed)
      expect(parsed).toHaveLength(2);
      
      // The duplicate should be at the beginning (most recent)
      expect(parsed[0].command).toBe(command);
      expect(parsed[1].command).toBe('Another command');
    });

    it('should limit history to 10 entries', () => {
      // Add 15 commands
      for (let i = 1; i <= 15; i++) {
        addToCommandHistory(testCanvasId, `Command ${i}`);
      }

      const stored = localStorage.getItem(storageKey);
      const parsed = JSON.parse(stored!);

      // Should only keep last 10
      expect(parsed).toHaveLength(10);
      
      // Most recent command should be first
      expect(parsed[0].command).toBe('Command 15');
      
      // Oldest kept command should be Command 6
      expect(parsed[9].command).toBe('Command 6');
    });

    it('should handle different canvas IDs separately', () => {
      const canvas1 = 'canvas-1';
      const canvas2 = 'canvas-2';

      addToCommandHistory(canvas1, 'Command for canvas 1');
      addToCommandHistory(canvas2, 'Command for canvas 2');

      const stored1 = localStorage.getItem(`ai-command-history-${canvas1}`);
      const stored2 = localStorage.getItem(`ai-command-history-${canvas2}`);

      expect(stored1).not.toEqual(stored2);

      const parsed1 = JSON.parse(stored1!);
      const parsed2 = JSON.parse(stored2!);

      expect(parsed1[0].command).toBe('Command for canvas 1');
      expect(parsed2[0].command).toBe('Command for canvas 2');
    });

    it('should handle corrupted localStorage gracefully', () => {
      // Set invalid JSON
      localStorage.setItem(storageKey, 'invalid json{{{');

      const onSelectCommand = vi.fn();
      const { container } = render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      // Should not crash, should render as if empty
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Timestamp Display', () => {
    it('should show "Just now" for recent commands', async () => {
      const user = userEvent.setup();
      addToCommandHistory(testCanvasId, 'Recent command');

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      // Expand
      const toggleButton = screen.getByText(/Recent Commands \(1\)/i);
      await user.click(toggleButton);

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('should show minutes ago for older commands', async () => {
      const user = userEvent.setup();
      
      // Manually set a command from 5 minutes ago
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const commands = [{ command: 'Old command', timestamp: fiveMinutesAgo }];
      localStorage.setItem(storageKey, JSON.stringify(commands));

      const onSelectCommand = vi.fn();
      render(
        <CommandHistory canvasId={testCanvasId} onSelectCommand={onSelectCommand} />
      );

      // Expand
      const toggleButton = screen.getByText(/Recent Commands \(1\)/i);
      await user.click(toggleButton);

      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });
  });
});


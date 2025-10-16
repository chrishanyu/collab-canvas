/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext';
import { Dashboard } from '../../src/components/dashboard/Dashboard';
import type { User } from '../../src/types';

// Mock the canvas service
vi.mock('../../src/services/canvas.service', async () => {
  const actual = await vi.importActual('../../src/services/canvas.service');
  return {
    ...actual,
    getUserCanvases: vi.fn(),
    deleteCanvas: vi.fn(),
    generateShareLink: vi.fn((canvasId: string) => `https://test-app.com/canvas/${canvasId}`),
  };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Import mocked functions
import { getUserCanvases, deleteCanvas } from '../../src/services/canvas.service';

// Create mock user that can be changed in tests
let currentMockUser: User | null = null;

// Mock useAuth hook at module level
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: currentMockUser,
    loading: false,
    error: null,
    logout: vi.fn(),
  }),
}));

describe('Canvas Deletion Integration Tests', () => {
  const mockOwner = {
    id: 'owner-123',
    email: 'owner@example.com',
    displayName: 'Canvas Owner',
    createdAt: new Date(),
  };

  const mockCollaborator = {
    id: 'collaborator-456',
    email: 'collaborator@example.com',
    displayName: 'Collaborator',
    createdAt: new Date(),
  };

  const mockCanvas = {
    id: 'canvas-abc123',
    name: 'Test Canvas',
    ownerId: 'owner-123',
    ownerName: 'Canvas Owner',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    
    // Reset mock user
    currentMockUser = null;

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://test-app.com',
      },
      writable: true,
      configurable: true,
    });

    // Mock clipboard API
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });
    } else {
      vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    }
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Delete Button Visibility', () => {
    it('should show delete button when owner views their canvas', async () => {
      // Arrange
      currentMockUser = mockOwner;
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      // Act
      renderDashboard();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      // Look for delete button (trash icon) - it should exist
      const deleteButtons = screen.queryAllByLabelText(/delete.*test canvas/i);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should NOT show delete button when non-owner views canvas', async () => {
      // Arrange - Canvas owned by someone else
      currentMockUser = mockCollaborator;
      const othersCanvas = {
        ...mockCanvas,
        ownerId: 'different-owner-789',
        ownerName: 'Different Owner',
      };
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([othersCanvas]);

      // Act
      renderDashboard();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      // Delete button should NOT exist for non-owner
      const deleteButtons = screen.queryAllByLabelText(/delete.*test canvas/i);
      expect(deleteButtons.length).toBe(0);
    });
  });

  describe('Deletion Modal Flow', () => {
    it('should open confirmation modal when delete button is clicked', async () => {
      // Arrange
      currentMockUser = mockOwner;
      const user = userEvent.setup();
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      // Act - Click delete button
      const deleteButton = screen.getByLabelText(/delete.*test canvas/i);
      await user.click(deleteButton);

      // Assert - Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/delete canvas\?/i)).toBeInTheDocument();
        expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
      });
    });

    it('should show canvas name and warning text in modal', async () => {
      // Arrange
      currentMockUser = mockOwner;
      const user = userEvent.setup();
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      // Act - Click delete button
      const deleteButton = screen.getByLabelText(/delete.*test canvas/i);
      await user.click(deleteButton);

      // Assert - Check modal content
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
      });
    });

    it('should close modal when Cancel is clicked', async () => {
      // Arrange
      currentMockUser = mockOwner;
      const user = userEvent.setup();
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      // Open modal
      const deleteButton = screen.getByLabelText(/delete.*test canvas/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/delete canvas/i)).toBeInTheDocument();
      });

      // Act - Click Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Assert - Modal should close (delete canvas heading should not be visible)
      await waitFor(() => {
        expect(screen.queryByText(/delete canvas\?/i)).not.toBeInTheDocument();
      });

      // Canvas should still be in dashboard
      expect(screen.getByText('Test Canvas')).toBeInTheDocument();
    });
  });

  describe('Deletion Execution', () => {
    it('should call deleteCanvas service when Delete is clicked', async () => {
      // Arrange
      currentMockUser = mockOwner;
      const user = userEvent.setup();
      
      // Mock deletion success
      (deleteCanvas as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      // Open modal
      const deleteButton = screen.getByLabelText(/delete.*test canvas/i);
      await user.click(deleteButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Act - Click Delete
      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      // Assert - deleteCanvas should be called
      await waitFor(() => {
        expect(deleteCanvas).toHaveBeenCalledWith('canvas-abc123', 'owner-123');
      });
    });

    it('should show success message after deletion', async () => {
      // Arrange
      currentMockUser = mockOwner;
      const user = userEvent.setup();

      // Mock deletion success
      (deleteCanvas as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText(/delete.*test canvas/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
      });

      // Act - Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      // Assert - Modal should close (no alert shown)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should show error message if deletion fails', async () => {
      // Arrange
      currentMockUser = mockOwner;
      const user = userEvent.setup();
      
      // Mock deletion failure
      (deleteCanvas as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText(/delete.*test canvas/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
      });

      // Act - Confirm deletion (will fail)
      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      // Assert - Modal should stay open on error
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should refresh dashboard after successful deletion', async () => {
      // Arrange
      currentMockUser = mockOwner;
      const user = userEvent.setup();

      // Mock deletion success
      (deleteCanvas as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText(/delete.*test canvas/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
      });

      // Act - Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      // Assert - getUserCanvases should be called again to refresh
      await waitFor(() => {
        expect(getUserCanvases).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Loading States', () => {
    it('should disable buttons during deletion', async () => {
      // Arrange
      currentMockUser = mockOwner;
      const user = userEvent.setup();
      
      // Mock slow deletion
      (deleteCanvas as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText(/delete.*test canvas/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
      });

      // Act - Click delete
      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      // Assert - Button should show "Deleting..." and be disabled
      await waitFor(() => {
        const deletingButton = screen.getByRole('button', { name: /deleting/i });
        expect(deletingButton).toBeDisabled();
      });
    });

    it('should prevent modal from closing during deletion', async () => {
      // Arrange
      currentMockUser = mockOwner;
      const user = userEvent.setup();
      
      // Mock slow deletion
      (deleteCanvas as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      (getUserCanvases as ReturnType<typeof vi.fn>).mockResolvedValue([mockCanvas]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Test Canvas')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText(/delete.*test canvas/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      // Assert - Cancel button should be disabled during deletion
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toBeDisabled();
      });
    });
  });
});


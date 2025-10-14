import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext';
import { Dashboard } from '../../src/components/dashboard/Dashboard';
import {
  mockGetDocs,
  mockSetDoc,
  mockDoc,
  mockCollection,
  mockQuery,
  mockWhere,
  mockTimestamp,
  MockTimestamp,
  resetAllMocks,
} from '../mocks/firebase.mock';

// Mock the canvas service
vi.mock('../../src/services/canvas.service', async () => {
  const actual = await vi.importActual('../../src/services/canvas.service');
  return {
    ...actual,
    createCanvas: vi.fn(),
    getUserCanvases: vi.fn(),
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
import { createCanvas, getUserCanvases } from '../../src/services/canvas.service';

// Mock useAuth hook outside of describe
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date(),
    },
    loading: false,
    error: null,
    logout: vi.fn(),
  }),
}));

describe('Dashboard Flow Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: new Date(),
  };

  // Setup hooks
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://test-app.com',
      },
      writable: true,
      configurable: true,
    });

    // Mock clipboard API - create the clipboard object if it doesn't exist
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });
    } else {
      // If it exists, just mock the writeText method
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

  it('should show empty dashboard with "Create" button on first login', async () => {
    // Arrange
    (getUserCanvases as any).mockResolvedValue([]);

    // Act
    renderDashboard();

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/no canvases yet/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/create one to get started/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create new canvas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first canvas/i })).toBeInTheDocument();
  });

  it('should open modal when clicking "Create New Canvas" button', async () => {
    // Arrange
    (getUserCanvases as any).mockResolvedValue([]);
    const user = userEvent.setup();

    // Act
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no canvases yet/i)).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create new canvas/i });
    await user.click(createButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/canvas name/i)).toBeInTheDocument();
    });
  });

  it('should create canvas and navigate when submitting modal', async () => {
    // Arrange
    (getUserCanvases as any).mockResolvedValue([]);
    const mockNewCanvas = {
      id: 'canvas-new-123',
      name: 'My New Canvas',
      ownerId: mockUser.id,
      ownerName: mockUser.displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (createCanvas as any).mockResolvedValue(mockNewCanvas);

    const user = userEvent.setup();

    // Act
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no canvases yet/i)).toBeInTheDocument();
    });

    // Open modal
    const createButton = screen.getByRole('button', { name: /create new canvas/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Enter canvas name
    const nameInput = screen.getByLabelText(/canvas name/i);
    await user.type(nameInput, 'My New Canvas');

    // Submit
    const submitButton = screen.getByRole('button', { name: /create canvas/i });
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(createCanvas).toHaveBeenCalledWith(
        'My New Canvas',
        mockUser.id,
        mockUser.displayName
      );
      expect(mockNavigate).toHaveBeenCalledWith('/canvas/canvas-new-123');
    });
  });

  it('should display canvas cards for existing canvases', async () => {
    // Arrange
    const mockCanvases = [
      {
        id: 'canvas-1',
        name: 'First Canvas',
        ownerId: mockUser.id,
        ownerName: mockUser.displayName,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: 'canvas-2',
        name: 'Second Canvas',
        ownerId: 'other-user',
        ownerName: 'Other User',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-22'),
      },
    ];
    (getUserCanvases as any).mockResolvedValue(mockCanvases);

    // Act
    renderDashboard();

    // Assert
    await waitFor(() => {
      expect(screen.getByText('First Canvas')).toBeInTheDocument();
      expect(screen.getByText('Second Canvas')).toBeInTheDocument();
    });

    expect(screen.getByText(/by Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/by Other User/i)).toBeInTheDocument();
  });

  it('should navigate to canvas when clicking canvas card', async () => {
    // Arrange
    const mockCanvases = [
      {
        id: 'canvas-123',
        name: 'Test Canvas',
        ownerId: mockUser.id,
        ownerName: mockUser.displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (getUserCanvases as any).mockResolvedValue(mockCanvases);
    const user = userEvent.setup();

    // Act
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Canvas')).toBeInTheDocument();
    });

    const canvasCard = screen.getByText('Test Canvas').closest('[role="button"]');
    expect(canvasCard).toBeInTheDocument();

    await user.click(canvasCard!);

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/canvas/canvas-123');
    });
  });

  it('should open share modal when clicking share button', async () => {
    // Arrange
    const mockCanvases = [
      {
        id: 'canvas-share-123',
        name: 'Canvas to Share',
        ownerId: mockUser.id,
        ownerName: mockUser.displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (getUserCanvases as any).mockResolvedValue(mockCanvases);
    const user = userEvent.setup();

    // Act
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Canvas to Share')).toBeInTheDocument();
    });

    // Click share button (not the card itself)
    const shareButton = screen.getByLabelText(/share canvas to share/i);
    await user.click(shareButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /share canvas/i })).toBeInTheDocument();
      expect(screen.getByText(/share this link with anyone/i)).toBeInTheDocument();
    });
  });

  it('should copy share link to clipboard', async () => {
    // Arrange
    const mockCanvases = [
      {
        id: 'canvas-share-456',
        name: 'Canvas to Share',
        ownerId: mockUser.id,
        ownerName: mockUser.displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (getUserCanvases as any).mockResolvedValue(mockCanvases);
    const user = userEvent.setup();

    // Act
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Canvas to Share')).toBeInTheDocument();
    });

    // Open share modal
    const shareButton = screen.getByLabelText(/share canvas to share/i);
    await user.click(shareButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /share canvas/i })).toBeInTheDocument();
    });

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    // Assert
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://test-app.com/canvas/canvas-share-456'
      );
      expect(screen.getByText(/copied!/i)).toBeInTheDocument();
    });
  });

  it('should display multiple canvases in grid layout', async () => {
    // Arrange
    const mockCanvases = Array.from({ length: 6 }, (_, i) => ({
      id: `canvas-${i}`,
      name: `Canvas ${i + 1}`,
      ownerId: mockUser.id,
      ownerName: mockUser.displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    (getUserCanvases as any).mockResolvedValue(mockCanvases);

    // Act
    renderDashboard();

    // Assert
    await waitFor(() => {
      mockCanvases.forEach((canvas) => {
        expect(screen.getByText(canvas.name)).toBeInTheDocument();
      });
    });

    // Check that we don't see the empty state
    expect(screen.queryByText(/no canvases yet/i)).not.toBeInTheDocument();
  });

  it('should show loading spinner while fetching canvases', async () => {
    // Arrange
    (getUserCanvases as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    // Act
    renderDashboard();

    // Assert - loading spinner should be visible initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should handle canvas creation with default name', async () => {
    // Arrange
    (getUserCanvases as any).mockResolvedValue([]);
    const mockNewCanvas = {
      id: 'canvas-default',
      name: 'Untitled Canvas',
      ownerId: mockUser.id,
      ownerName: mockUser.displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (createCanvas as any).mockResolvedValue(mockNewCanvas);

    const user = userEvent.setup();

    // Act
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no canvases yet/i)).toBeInTheDocument();
    });

    // Open modal and submit without entering name
    const createButton = screen.getByRole('button', { name: /create new canvas/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create canvas/i });
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(createCanvas).toHaveBeenCalledWith(
        '', // Empty string passed
        mockUser.id,
        mockUser.displayName
      );
      expect(mockNavigate).toHaveBeenCalledWith('/canvas/canvas-default');
    });
  });
});


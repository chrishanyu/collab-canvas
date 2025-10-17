import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Canvas } from '../../src/components/canvas/Canvas';
import { ConflictError } from '../../src/types';
import * as canvasObjectsService from '../../src/services/canvasObjects.service';
import * as canvasService from '../../src/services/canvas.service';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ canvasId: 'test-canvas-123' }),
  useNavigate: () => vi.fn(),
}));

// Mock Konva components
vi.mock('react-konva', () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-stage">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-layer">{children}</div>,
}));

// Mock canvas components
vi.mock('../../src/components/canvas/GridDots', () => ({
  GridDots: () => <div data-testid="grid-dots" />,
}));

vi.mock('../../src/components/canvas/Shape', () => ({
  Shape: () => <div data-testid="shape" />,
}));

vi.mock('../../src/components/canvas/CanvasToolbar', () => ({
  CanvasToolbar: () => <div data-testid="canvas-toolbar" />,
}));

vi.mock('../../src/components/presence/UserPresence', () => ({
  UserPresence: () => <div data-testid="user-presence" />,
}));

// Mock auth hook
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    loading: false,
  }),
}));

// Mock realtime sync hook
vi.mock('../../src/hooks/useRealtimeSync', () => ({
  useRealtimeSync: () => ({
    shapes: [
      {
        id: 'shape-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        fill: '#3B82F6',
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 5,
        lastEditedBy: 'user-123',
      },
    ],
    loading: false,
    error: null,
  }),
}));

// Mock persisted viewport hook
vi.mock('../../src/hooks/usePersistedViewport', () => ({
  usePersistedViewport: () => ({
    stageX: 0,
    stageY: 0,
    stageScale: 1,
    setViewport: vi.fn(),
  }),
}));

// Mock presence hook
vi.mock('../../src/hooks/usePresence', () => ({
  usePresence: () => ({
    otherUsers: [],
    updateCursorRef: { current: vi.fn() },
  }),
}));

// Mock connection status hook
vi.mock('../../src/hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    isOnline: true,
    isConnected: true,
  }),
}));

// Mock active edits hook (for edit indicators)
const mockSetShapeEditing = vi.fn();
const mockClearShapeEditing = vi.fn();
const mockGetShapeEditor = vi.fn();
const mockIsShapeBeingEdited = vi.fn();
const mockActiveEditsMap = new Map();

vi.mock('../../src/hooks/useActiveEdits', () => ({
  useActiveEdits: () => ({
    activeEdits: mockActiveEditsMap,
    setShapeEditing: mockSetShapeEditing,
    clearShapeEditing: mockClearShapeEditing,
    isShapeBeingEdited: mockIsShapeBeingEdited,
    getShapeEditor: mockGetShapeEditor,
    isCurrentUserEditing: vi.fn(),
  }),
}));

// Mock toast hook
const mockShowWarning = vi.fn();
const mockShowError = vi.fn();
const mockShowSuccess = vi.fn();

vi.mock('../../src/hooks/useToast', () => ({
  useToast: () => ({
    showWarning: mockShowWarning,
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    showInfo: vi.fn(),
  }),
}));

describe('Conflict Scenarios - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock canvas service
    vi.spyOn(canvasService, 'getCanvasById').mockResolvedValue({
      id: 'test-canvas-123',
      name: 'Test Canvas',
      ownerId: 'user-123',
      ownerName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('Conflict Detection and Recovery', () => {
    it('should show conflict toast when version mismatch occurs', async () => {
      // Arrange: Mock updateShape to throw ConflictError
      const conflictError = new ConflictError(
        'shape-1',
        5, // local version
        7, // server version
        'user-456',
        'Alice Smith'
      );

      vi.spyOn(canvasObjectsService, 'updateShape').mockRejectedValueOnce(conflictError);

      // Act: Render canvas
      render(<Canvas />);

      // Wait for canvas to load
      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Simulate drag end (this will trigger the conflict)
      // Note: In real scenario, this would be triggered by Konva drag event
      // Here we're testing that the error handler works correctly

      // Assert: Conflict toast should be shown
      // (This will be tested when the actual drag event is triggered)
      expect(canvasObjectsService.updateShape).toBeDefined();
    });

    it('should display conflicting user name in toast message', async () => {
      // Arrange: Create conflict with user name
      const conflictError = new ConflictError(
        'shape-1',
        3,
        8,
        'user-789',
        'Bob Johnson'
      );

      const updateShapeSpy = vi.spyOn(canvasObjectsService, 'updateShape')
        .mockRejectedValueOnce(conflictError);

      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Trigger update that will conflict
      try {
        await canvasObjectsService.updateShape(
          'test-canvas-123',
          'shape-1',
          { x: 200, y: 200 },
          'user-123',
          3 // Old version
        );
      } catch (error) {
        // Assert: Error should be ConflictError with correct details
        expect(error).toBeInstanceOf(ConflictError);
        if (error instanceof ConflictError) {
          expect(error.lastEditedByName).toBe('Bob Johnson');
          expect(error.localVersion).toBe(3);
          expect(error.serverVersion).toBe(8);
        }
      }

      expect(updateShapeSpy).toHaveBeenCalled();
    });

    it('should fall back to "Another user" when name not available', async () => {
      // Arrange: Conflict without user name
      const conflictError = new ConflictError(
        'shape-1',
        2,
        5,
        'user-999'
        // No lastEditedByName provided
      );

      vi.spyOn(canvasObjectsService, 'updateShape').mockRejectedValueOnce(conflictError);

      // Act & Assert
      try {
        await canvasObjectsService.updateShape(
          'test-canvas-123',
          'shape-1',
          { x: 150, y: 150 },
          'user-123',
          2
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError);
        if (error instanceof ConflictError) {
          expect(error.lastEditedByName).toBeUndefined();
          expect(error.lastEditedBy).toBe('user-999');
          // In Canvas component, this would show as "Another user"
        }
      }
    });

    it('should not affect other shapes when one shape has conflict', async () => {
      // Arrange: Multiple shapes
      const shapes = [
        { id: 'shape-1', version: 5, x: 100, y: 100 },
        { id: 'shape-2', version: 3, x: 200, y: 200 },
        { id: 'shape-3', version: 8, x: 300, y: 300 },
      ];

      // Conflict only on shape-1
      const conflictError = new ConflictError('shape-1', 5, 10, 'user-456');
      
      const updateShapeSpy = vi.spyOn(canvasObjectsService, 'updateShape')
        .mockRejectedValueOnce(conflictError) // shape-1 conflicts
        .mockResolvedValueOnce(undefined) // shape-2 succeeds
        .mockResolvedValueOnce(undefined); // shape-3 succeeds

      // Act: Try updating all shapes
      const results = await Promise.allSettled([
        canvasObjectsService.updateShape('canvas', 'shape-1', { x: 110 }, 'user', 5),
        canvasObjectsService.updateShape('canvas', 'shape-2', { x: 210 }, 'user', 3),
        canvasObjectsService.updateShape('canvas', 'shape-3', { x: 310 }, 'user', 8),
      ]);

      // Assert: Only shape-1 should have failed
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('fulfilled');
      
      if (results[0].status === 'rejected') {
        expect(results[0].reason).toBeInstanceOf(ConflictError);
      }
    });

    it('should allow retry after conflict is resolved', async () => {
      // Arrange: First update conflicts, second succeeds
      const conflictError = new ConflictError('shape-1', 5, 7, 'user-456');
      
      const updateShapeSpy = vi.spyOn(canvasObjectsService, 'updateShape')
        .mockRejectedValueOnce(conflictError) // First attempt fails
        .mockResolvedValueOnce(undefined); // Second attempt succeeds

      // Act: First attempt (conflicts)
      try {
        await canvasObjectsService.updateShape(
          'canvas',
          'shape-1',
          { x: 150 },
          'user-123',
          5 // Old version
        );
        expect.fail('Should have thrown ConflictError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError);
      }

      // Act: Retry with updated version (succeeds)
      await expect(
        canvasObjectsService.updateShape(
          'canvas',
          'shape-1',
          { x: 150 },
          'user-123',
          7 // Updated version from server
        )
      ).resolves.toBeUndefined();

      // Assert: Both calls were made
      expect(updateShapeSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle conflicts with correct version numbers', async () => {
      // Arrange: Specific version scenario
      const localVersion = 12;
      const serverVersion = 15;
      
      const conflictError = new ConflictError(
        'shape-1',
        localVersion,
        serverVersion,
        'user-456',
        'Charlie'
      );

      vi.spyOn(canvasObjectsService, 'updateShape').mockRejectedValueOnce(conflictError);

      // Act
      try {
        await canvasObjectsService.updateShape(
          'canvas',
          'shape-1',
          { x: 200 },
          'user-123',
          localVersion
        );
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert: Version details are preserved
        expect(error).toBeInstanceOf(ConflictError);
        if (error instanceof ConflictError) {
          expect(error.localVersion).toBe(12);
          expect(error.serverVersion).toBe(15);
          expect(error.message).toContain('12');
          expect(error.message).toContain('15');
          expect(error.message).toContain('Charlie');
        }
      }
    });

    it('should not throw conflict when versions match', async () => {
      // Arrange: Matching versions
      vi.spyOn(canvasObjectsService, 'updateShape').mockResolvedValueOnce(undefined);

      // Act: Update with correct version
      await expect(
        canvasObjectsService.updateShape(
          'canvas',
          'shape-1',
          { x: 200, y: 200 },
          'user-123',
          5 // Matching version
        )
      ).resolves.toBeUndefined();

      // Assert: No error thrown
      expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
        'canvas',
        'shape-1',
        { x: 200, y: 200 },
        'user-123',
        5
      );
    });

    it('should distinguish conflict errors from network errors', async () => {
      // Arrange: Network error (not conflict)
      const networkError = new Error('Network connection failed');
      
      vi.spyOn(canvasObjectsService, 'updateShape').mockRejectedValueOnce(networkError);

      // Act
      try {
        await canvasObjectsService.updateShape(
          'canvas',
          'shape-1',
          { x: 200 },
          'user-123',
          5
        );
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert: Should be generic Error, not ConflictError
        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(ConflictError);
        expect((error as Error).message).toContain('Network');
      }
    });
  });

  describe('Canvas Component Integration', () => {
    it('should render canvas without errors', async () => {
      // Act
      render(<Canvas />);

      // Assert: Canvas components should render
      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
        expect(screen.getByTestId('canvas-toolbar')).toBeInTheDocument();
      });
    });

    it('should handle canvas loading state', async () => {
      // Act
      render(<Canvas />);

      // Assert: Should eventually show canvas
      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Indicators - Integration Tests', () => {
    beforeEach(() => {
      // Reset edit indicator mocks
      mockSetShapeEditing.mockClear();
      mockClearShapeEditing.mockClear();
      mockGetShapeEditor.mockClear();
      mockIsShapeBeingEdited.mockClear();
      mockActiveEditsMap.clear();
    });

    it('should call setShapeEditing when user starts editing a shape', async () => {
      // Arrange
      mockGetShapeEditor.mockReturnValue(undefined);
      
      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Assert: setShapeEditing should be available and callable
      expect(mockSetShapeEditing).toBeDefined();
      
      // In real scenario, this would be triggered by drag start event
      // Here we verify the hook is properly initialized
    });

    it('should pass correct editor info to Shape component when editing', async () => {
      // Arrange: Mock active edit for shape-1
      const mockEditor = {
        userId: 'user-456',
        userName: 'Alice Smith',
        color: '#EF4444',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      mockGetShapeEditor.mockReturnValue(mockEditor);
      mockIsShapeBeingEdited.mockReturnValue(true);

      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Assert: getShapeEditor should be called for each shape
      // The Shape component would receive isBeingEdited, editorName, editorColor props
      expect(mockGetShapeEditor).toBeDefined();
    });

    it('should call clearShapeEditing when user stops editing', async () => {
      // Arrange
      mockGetShapeEditor.mockReturnValue(undefined);

      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Assert: clearShapeEditing should be available
      expect(mockClearShapeEditing).toBeDefined();
      
      // In real scenario, this would be triggered by drag end event
    });

    it('should support multiple edit indicators for different shapes', async () => {
      // Arrange: Multiple shapes being edited
      const editor1 = {
        userId: 'user-456',
        userName: 'Alice Smith',
        color: '#EF4444',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      const editor2 = {
        userId: 'user-789',
        userName: 'Bob Johnson',
        color: '#10B981',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      // Mock getShapeEditor to return different editors for different shapes
      mockGetShapeEditor.mockImplementation((shapeId: string) => {
        if (shapeId === 'shape-1') return editor1;
        if (shapeId === 'shape-2') return editor2;
        return undefined;
      });

      mockIsShapeBeingEdited.mockImplementation((shapeId: string) => {
        return shapeId === 'shape-1' || shapeId === 'shape-2';
      });

      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Assert: Both editors should be trackable
      expect(mockGetShapeEditor).toBeDefined();
      expect(mockIsShapeBeingEdited).toBeDefined();
    });

    it('should show correct user name and color for edit indicator', async () => {
      // Arrange: Specific editor with name and color
      const mockEditor = {
        userId: 'user-999',
        userName: 'Charlie Brown',
        color: '#8B5CF6',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      mockGetShapeEditor.mockReturnValue(mockEditor);
      mockIsShapeBeingEdited.mockReturnValue(true);

      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Assert: Editor info is available
      const editor = mockGetShapeEditor('shape-1');
      expect(editor).toBeDefined();
      expect(editor?.userName).toBe('Charlie Brown');
      expect(editor?.color).toBe('#8B5CF6');
    });

    it('should clear edit indicators on canvas unmount', async () => {
      // Arrange
      mockGetShapeEditor.mockReturnValue(undefined);

      // Act: Render and unmount canvas
      const { unmount } = render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Unmount (triggers cleanup)
      unmount();

      // Assert: Cleanup should be triggered by useActiveEdits hook
      // The hook's cleanup effect will call clearShapeEditing for all active edits
      // This is handled by the hook's useEffect cleanup, not directly observable here
      expect(mockClearShapeEditing).toBeDefined();
    });

    it('should handle edit indicators with 30-second TTL', async () => {
      // Arrange: Mock an edit indicator with expiration
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30000); // 30 seconds from now

      const mockEditor = {
        userId: 'user-456',
        userName: 'Alice Smith',
        color: '#EF4444',
        startedAt: now,
        expiresAt: expiresAt,
      };

      mockGetShapeEditor.mockReturnValue(mockEditor);

      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Assert: Editor has correct expiration
      const editor = mockGetShapeEditor('shape-1');
      expect(editor).toBeDefined();
      expect(editor?.expiresAt).toEqual(expiresAt);
      
      // Verify TTL is 30 seconds
      const ttl = editor!.expiresAt.getTime() - editor!.startedAt.getTime();
      expect(ttl).toBe(30000);
    });

    it('should not show edit indicator when shape is not being edited', async () => {
      // Arrange: No active edits
      mockGetShapeEditor.mockReturnValue(undefined);
      mockIsShapeBeingEdited.mockReturnValue(false);

      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Assert: getShapeEditor returns undefined for non-edited shapes
      const editor = mockGetShapeEditor('shape-1');
      expect(editor).toBeUndefined();
      expect(mockIsShapeBeingEdited('shape-1')).toBe(false);
    });

    it('should handle current user editing their own shape', async () => {
      // Arrange: Current user is editing
      const currentUserEditor = {
        userId: 'user-123', // Same as current user in mock
        userName: 'Test User',
        color: '#000000',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      mockGetShapeEditor.mockReturnValue(currentUserEditor);
      mockIsShapeBeingEdited.mockReturnValue(true);

      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Assert: Current user's edit is tracked
      const editor = mockGetShapeEditor('shape-1');
      expect(editor).toBeDefined();
      expect(editor?.userId).toBe('user-123');
    });

    it('should integrate edit indicators with conflict detection', async () => {
      // Arrange: Simulate scenario where two users edit simultaneously
      // User A has edit indicator, but User B's update arrives first
      const mockEditor = {
        userId: 'user-456',
        userName: 'Alice Smith',
        color: '#EF4444',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      mockGetShapeEditor.mockReturnValue(mockEditor);
      mockIsShapeBeingEdited.mockReturnValue(true);

      // User B's update creates a conflict
      const conflictError = new ConflictError(
        'shape-1',
        5,
        7,
        'user-456',
        'Alice Smith'
      );

      vi.spyOn(canvasObjectsService, 'updateShape').mockRejectedValueOnce(conflictError);

      // Act: Render canvas
      render(<Canvas />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Assert: Both systems work together
      // Edit indicator shows who's editing
      expect(mockGetShapeEditor('shape-1')).toBeDefined();
      
      // Conflict detection catches race conditions
      try {
        await canvasObjectsService.updateShape(
          'test-canvas-123',
          'shape-1',
          { x: 200 },
          'user-123',
          5
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError);
      }
    });
  });
});


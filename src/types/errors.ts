/**
 * Custom Error Types for CollabCanvas
 * 
 * These error types provide structured information about specific failure modes
 * in the collaborative editing system.
 */

/**
 * ConflictError - Thrown when a version conflict is detected during shape updates
 * 
 * This error occurs when a user attempts to save changes to a shape that has been
 * modified by another user since they started editing. The conflict is detected
 * through version checking: if the local version doesn't match the server version,
 * it means another user has made changes in the meantime.
 * 
 * @example
 * ```typescript
 * try {
 *   await updateShape(canvasId, shapeId, updates, userId, localVersion);
 * } catch (error) {
 *   if (error instanceof ConflictError) {
 *     console.log(`Conflict detected on shape ${error.shapeId}`);
 *     console.log(`Your version: ${error.localVersion}, Server version: ${error.serverVersion}`);
 *     console.log(`Last edited by: ${error.lastEditedByName || error.lastEditedBy}`);
 *     // Reload shape from server and notify user
 *   }
 * }
 * ```
 * 
 * @see updateShape in canvasObjects.service.ts for version checking implementation
 */
export class ConflictError extends Error {
  /**
   * The ID of the shape that has a conflict
   */
  public readonly shapeId: string;

  /**
   * The version number the user was editing (local/client version)
   */
  public readonly localVersion: number;

  /**
   * The current version number on the server
   */
  public readonly serverVersion: number;

  /**
   * The user ID of the person who last edited this shape (causing the conflict)
   */
  public readonly lastEditedBy: string;

  /**
   * The display name of the person who last edited this shape (if available)
   * This provides a user-friendly name for conflict notifications
   */
  public readonly lastEditedByName?: string;

  /**
   * Creates a new ConflictError
   * 
   * @param shapeId - ID of the conflicting shape
   * @param localVersion - Version the user was editing
   * @param serverVersion - Current version on server
   * @param lastEditedBy - User ID who last modified the shape
   * @param lastEditedByName - Display name of user who last modified (optional)
   */
  constructor(
    shapeId: string,
    localVersion: number,
    serverVersion: number,
    lastEditedBy: string,
    lastEditedByName?: string
  ) {
    // Create user-friendly error message
    const editorName = lastEditedByName || lastEditedBy;
    const message = `Shape ${shapeId} was modified by ${editorName}. Your version: ${localVersion}, Server version: ${serverVersion}`;
    
    super(message);
    
    // Set error name for easier identification
    this.name = 'ConflictError';
    
    // Store conflict details
    this.shapeId = shapeId;
    this.localVersion = localVersion;
    this.serverVersion = serverVersion;
    this.lastEditedBy = lastEditedBy;
    this.lastEditedByName = lastEditedByName;
  }
}


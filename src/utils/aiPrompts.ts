/**
 * OpenAI Function Schemas and System Prompts for AI Canvas Agent
 */

export const SYSTEM_PROMPT = `You are an AI assistant for CollabCanvas, a collaborative design tool. Your job is to interpret user commands and call canvas manipulation functions to create, modify, and arrange shapes.

Canvas Coordinate System:
- (0, 0) is the canvas center
- Positive X is right, positive Y is down
- Typical canvas viewport: -1000 to +1000 in both directions

Default Values:
- Shape size: 100x100 for circles/squares, 200x40 for rectangles
- Colors: Use standard names (red, blue, green) or hex codes (#FF0000, #0000FF, #00FF00)
- Spacing: 20-30px between elements
- Text size: 16-20px font size

Guidelines:
1. Always call functions to create/modify shapes (don't just describe)
2. For ambiguous references ("the rectangle"), use most recent or selected shape
3. For complex commands, break into multiple function calls
4. Infer reasonable defaults for missing parameters
5. Position shapes at canvas center (0, 0) unless specified
6. Use professional spacing and alignment for layouts

Example Commands:
- "Create a red circle" → createShape('circle', 0, 0, 100, 100, '#FF0000')
- "Make a 200x100 rectangle" → createShape('rectangle', 0, 0, 200, 100, '#3B82F6')
- "Add text that says Hello" → createShape('text', 0, 0, 200, 40, '#000000', 'Hello')`;

export const FUNCTION_SCHEMAS = [
  {
    name: 'createShape',
    description: 'Create a new shape on the canvas',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['rectangle', 'circle', 'text'],
          description: 'Type of shape to create',
        },
        x: {
          type: 'number',
          description: 'X coordinate (0 is canvas center)',
        },
        y: {
          type: 'number',
          description: 'Y coordinate (0 is canvas center)',
        },
        width: {
          type: 'number',
          description: 'Width in pixels',
        },
        height: {
          type: 'number',
          description: 'Height in pixels',
        },
        color: {
          type: 'string',
          description: 'Color as hex code or name (e.g., #FF0000 or red)',
        },
        text: {
          type: 'string',
          description: 'Text content (required if type is text)',
        },
      },
      required: ['type', 'x', 'y', 'width', 'height', 'color'],
    },
  },
  {
    name: 'moveShape',
    description: 'Move an existing shape to a new position',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to move',
        },
        x: {
          type: 'number',
          description: 'New X coordinate',
        },
        y: {
          type: 'number',
          description: 'New Y coordinate',
        },
      },
      required: ['shapeId', 'x', 'y'],
    },
  },
  {
    name: 'getCanvasState',
    description: 'Get all shapes currently on the canvas',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

// Color name to hex mapping
export const COLOR_MAP: Record<string, string> = {
  red: '#FF0000',
  blue: '#0000FF',
  green: '#00FF00',
  yellow: '#FFFF00',
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#808080',
  grey: '#808080',
};

/**
 * Convert color name to hex code
 */
export function normalizeColor(color: string): string {
  const lowerColor = color.toLowerCase();
  return COLOR_MAP[lowerColor] || color;
}


/**
 * OpenAI Tool Schemas (Modern API)
 * Defines available tools that AI can call
 */

export const TOOLS = [
  {
    type: 'function' as const,
    function: {
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
  },
  {
    type: 'function' as const,
    function: {
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
  },
  {
    type: 'function' as const,
    function: {
      name: 'getCanvasState',
      description: 'Get all shapes currently on the canvas',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];


/**
 * OpenAI Tool Schemas (Modern API)
 * Defines available tools that AI can call
 * 
 * Categories:
 * - Creation: createShape
 * - Manipulation: moveShape, resizeShape, rotateShape, updateShapeColor, deleteShape
 * - Layout: arrangeHorizontally, arrangeVertically, createGrid, distributeEvenly
 * - Query: getCanvasState, getShapesByColor, getShapesByType, getSelectedShapes, getRecentShapes
 */

export const TOOLS = [
  // ==================== CREATION COMMANDS ====================
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

  // ==================== MANIPULATION COMMANDS ====================
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
      name: 'resizeShape',
      description: 'Resize an existing shape by changing its width and height',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to resize',
          },
          width: {
            type: 'number',
            description: 'New width in pixels',
          },
          height: {
            type: 'number',
            description: 'New height in pixels',
          },
        },
        required: ['shapeId', 'width', 'height'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'rotateShape',
      description: 'Rotate an existing shape by a specified angle',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to rotate',
          },
          degrees: {
            type: 'number',
            description: 'Rotation angle in degrees (0-360)',
          },
        },
        required: ['shapeId', 'degrees'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'updateShapeColor',
      description: 'Change the color of an existing shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to update',
          },
          color: {
            type: 'string',
            description: 'New color as hex code or name (e.g., #FF0000 or red)',
          },
        },
        required: ['shapeId', 'color'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'deleteShape',
      description: 'Delete an existing shape from the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to delete',
          },
        },
        required: ['shapeId'],
      },
    },
  },

  // ==================== LAYOUT COMMANDS ====================
  {
    type: 'function' as const,
    function: {
      name: 'arrangeHorizontally',
      description: 'Arrange multiple shapes in a horizontal row with even spacing',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange',
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels (default: 20)',
          },
          startX: {
            type: 'number',
            description: 'Starting X coordinate (default: 0 for center)',
          },
          startY: {
            type: 'number',
            description: 'Y coordinate for all shapes (default: 0 for center)',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'arrangeVertically',
      description: 'Arrange multiple shapes in a vertical column with even spacing',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange',
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels (default: 20)',
          },
          startX: {
            type: 'number',
            description: 'X coordinate for all shapes (default: 0 for center)',
          },
          startY: {
            type: 'number',
            description: 'Starting Y coordinate (default: 0 for center)',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'createGrid',
      description: 'Create a grid of shapes with specified rows and columns',
      parameters: {
        type: 'object',
        properties: {
          rows: {
            type: 'number',
            description: 'Number of rows in the grid',
          },
          cols: {
            type: 'number',
            description: 'Number of columns in the grid',
          },
          shapeType: {
            type: 'string',
            enum: ['rectangle', 'circle'],
            description: 'Type of shape to create for each grid cell',
          },
          size: {
            type: 'number',
            description: 'Size of each shape in pixels (default: 50)',
          },
          spacing: {
            type: 'number',
            description: 'Gap between shapes in pixels (default: 20)',
          },
          color: {
            type: 'string',
            description: 'Color for all shapes (default: blue)',
          },
        },
        required: ['rows', 'cols', 'shapeType'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'distributeEvenly',
      description: 'Distribute shapes evenly with equal spacing between them',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to distribute',
          },
          direction: {
            type: 'string',
            enum: ['horizontal', 'vertical'],
            description: 'Direction to distribute shapes',
          },
        },
        required: ['shapeIds', 'direction'],
      },
    },
  },

  // ==================== QUERY COMMANDS ====================
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
  {
    type: 'function' as const,
    function: {
      name: 'getShapesByColor',
      description: 'Find all shapes with a specific color',
      parameters: {
        type: 'object',
        properties: {
          color: {
            type: 'string',
            description: 'Color to search for (hex code or name)',
          },
        },
        required: ['color'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getShapesByType',
      description: 'Find all shapes of a specific type',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text'],
            description: 'Shape type to search for',
          },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getSelectedShapes',
      description: 'Get currently selected shapes on the canvas',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getRecentShapes',
      description: 'Get the most recently created shapes',
      parameters: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            description: 'Number of recent shapes to retrieve (default: 5)',
          },
        },
        required: [],
      },
    },
  },
];


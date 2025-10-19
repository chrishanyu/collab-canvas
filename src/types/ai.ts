// AI Command Types

export interface AICommandRequest {
  command: string;
  canvasId: string;
  userId: string;
  canvasState?: CanvasState;
}

export interface AICommandResponse {
  success: boolean;
  functionCalls?: FunctionCall[];
  error?: string;
  executionTime?: number;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface CanvasState {
  shapes: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    text?: string;
  }>;
  selectedShapeIds?: string[];
  viewport?: {
    x: number;
    y: number;
    scale: number;
  };
}

// AI Agent State
export type AIAgentStatus = 'idle' | 'processing' | 'success' | 'error';

export interface AIAgentState {
  status: AIAgentStatus;
  error?: string;
  lastCommand?: string;
  isLoading: boolean;
}

// Function call execution result
export interface ExecutionResult {
  success: boolean;
  shapeIds?: string[];
  error?: string;
}


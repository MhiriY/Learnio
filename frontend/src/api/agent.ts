import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AskAgentRequest {
  prompt: string;
}

export interface AskAgentResponse {
  response: string;
}

/**
 * Sends a prompt to the AI agent backend
 * @param prompt - The user's prompt/question
 * @returns The agent's response
 */
export async function askAgent(prompt: string): Promise<string> {
  try {
    const response = await axios.post<AskAgentResponse>(
      `${API_BASE_URL}/agent/ask`,
      { prompt } as AskAgentRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to get response from agent'
      );
    }
    throw error;
  }
}



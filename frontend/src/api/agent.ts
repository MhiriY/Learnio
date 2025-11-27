import axiosInstance from './axiosInstance';
import axios from 'axios';

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
    const response = await axiosInstance.post<AskAgentResponse>(
      '/agent/ask',
      { prompt } as AskAgentRequest
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

export async function docChat(documentId: string, prompt: string) {
  try {
    const res = await axiosInstance.post('/agent/doc-chat', {
      documentId,
      prompt,
    });
    return res.data.answer;
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



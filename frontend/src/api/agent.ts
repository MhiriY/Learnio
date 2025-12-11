import axiosInstance from './axiosInstance';
import axios from 'axios';

export interface AskAgentRequest {
  prompt: string;
}

export interface AskAgentResponse {
  response: string;
}

export interface ChatRequest {
  prompt: string;
  conversationId?: string;
  courseId?: string;
  documentId?: string;
}

export interface RAGSource {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
}

export interface ChatResponse {
  conversationId: string;
  answer: string;
  sources?: RAGSource[];
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

/**
 * Chat with the agent using conversation persistence
 * @param prompt - The user's prompt
 * @param conversationId - Optional conversation ID to continue a conversation
 * @param courseId - Optional course ID to use course-level context
 * @param documentId - Optional document ID to use as context
 * @returns The agent's response and conversation ID
 */
export async function chat(
  prompt: string,
  conversationId?: string,
  courseId?: string,
  documentId?: string
): Promise<ChatResponse> {
  try {
    const response = await axiosInstance.post<ChatResponse>('/agent/chat', {
      prompt,
      conversationId,
      courseId,
      documentId,
    } as ChatRequest);
    return response.data;
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

/**
 * Chat with the agent using streaming responses
 * @param prompt - The user's prompt
 * @param conversationId - Optional conversation ID to continue a conversation
 * @param courseId - Optional course ID to use course-level context
 * @param documentId - Optional document ID to use as context
 * @param onChunk - Callback for each chunk of the response
 * @param onComplete - Callback when streaming is complete
 */
export async function chatStream(
  prompt: string,
  conversationId: string | undefined,
  courseId: string | undefined,
  documentId: string | undefined,
  onChunk: (content: string) => void,
  onComplete: (conversationId: string, sources?: RAGSource[]) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      `${axiosInstance.defaults.baseURL}/agent/chat/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          conversationId,
          courseId,
          documentId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    let buffer = '';
    let receivedConversationId: string | null = null;
    let receivedSources: RAGSource[] | undefined = undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim()) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.conversationId) {
                receivedConversationId = parsed.conversationId;
              }
              if (parsed.content) {
                onChunk(parsed.content);
              }
              if (parsed.sources) {
                receivedSources = parsed.sources;
              }
              if (parsed.done && receivedConversationId) {
                onComplete(receivedConversationId, receivedSources);
                return;
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Streaming failed'));
  }
}



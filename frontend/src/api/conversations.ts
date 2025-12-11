import axiosInstance from './axiosInstance';
import axios from 'axios';

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  documentId: string | null;
  courseId: string | null;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: string;
    originalFilename: string | null;
  };
  course?: {
    id: string;
    title: string;
  };
  _count?: {
    messages: number;
  };
}

export interface CreateConversationDto {
  documentId?: string;
  title?: string;
}

/**
 * Get all conversations for the logged-in user
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    const response = await axiosInstance.get<Conversation[]>('/conversations');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch conversations'
      );
    }
    throw error;
  }
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(id: string): Promise<Conversation> {
  try {
    const response = await axiosInstance.get<Conversation>(`/conversations/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch conversation'
      );
    }
    throw error;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  dto: CreateConversationDto
): Promise<Conversation> {
  try {
    const response = await axiosInstance.post<Conversation>(
      '/conversations',
      dto
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to create conversation'
      );
    }
    throw error;
  }
}

/**
 * Update a conversation
 */
export async function updateConversation(
  id: string,
  title: string
): Promise<Conversation> {
  try {
    const response = await axiosInstance.patch<Conversation>(
      `/conversations/${id}`,
      { title }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to update conversation'
      );
    }
    throw error;
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  try {
    await axiosInstance.delete(`/conversations/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to delete conversation'
      );
    }
    throw error;
  }
}


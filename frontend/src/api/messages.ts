import axiosInstance from './axiosInstance';
import axios from 'axios';

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

/**
 * Get all messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const response = await axiosInstance.get<Message[]>(
      `/conversations/${conversationId}/messages`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch messages'
      );
    }
    throw error;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(id: string): Promise<void> {
  try {
    await axiosInstance.delete(`/messages/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to delete message'
      );
    }
    throw error;
  }
}


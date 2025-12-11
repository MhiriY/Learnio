import axiosInstance from './axiosInstance';
import axios from 'axios';

export interface DocumentResponseDto {
  id: string;
  userId: string;
  originalFilename: string | null;
  mimeType: string | null;
  filePath: string;
  createdAt: string;
}

/**
 * Uploads a PDF document to the backend
 * @param file - The PDF file to upload
 * @param courseId - Optional course ID to assign the document to
 * @returns The uploaded document metadata
 */
export async function uploadDocument(
  file: File,
  courseId?: string,
): Promise<DocumentResponseDto> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const url = courseId
      ? `/documents/upload?courseId=${courseId}`
      : '/documents/upload';

    const response = await axiosInstance.post<DocumentResponseDto>(
      url,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to upload document'
      );
    }
    throw error;
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string): Promise<DocumentResponseDto> {
  try {
    const response = await axiosInstance.get<DocumentResponseDto>(
      `/documents/${id}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch document'
      );
    }
    throw error;
  }
}


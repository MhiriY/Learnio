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
 * @returns The uploaded document metadata
 */
export async function uploadDocument(
  file: File,
): Promise<DocumentResponseDto> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<DocumentResponseDto>(
      '/documents/upload',
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


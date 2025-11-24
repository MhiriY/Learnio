import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
 * @param userId - The user ID (temporary, will be replaced with auth later)
 * @returns The uploaded document metadata
 */
export async function uploadDocument(
  file: File,
  userId: string = 'test-user',
): Promise<DocumentResponseDto> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await axios.post<DocumentResponseDto>(
      `${API_BASE_URL}/documents/upload`,
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


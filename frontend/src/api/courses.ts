import axiosInstance from './axiosInstance';
import axios from 'axios';

export interface CourseResponseDto {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    documents: number;
    conversations: number;
  };
}

export interface CreateCourseDto {
  title: string;
  description?: string;
}

export interface CourseDocumentResponseDto {
  id: string;
  originalFilename: string | null;
  createdAt: string;
  status: string;
}

/**
 * Get all courses for the authenticated user
 */
export async function getCourses(): Promise<CourseResponseDto[]> {
  try {
    const response = await axiosInstance.get<CourseResponseDto[]>('/courses');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch courses'
      );
    }
    throw error;
  }
}

/**
 * Get a single course by ID
 */
export async function getCourse(courseId: string): Promise<CourseResponseDto> {
  try {
    const response = await axiosInstance.get<CourseResponseDto>(
      `/courses/${courseId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch course'
      );
    }
    throw error;
  }
}

/**
 * Create a new course
 */
export async function createCourse(
  data: CreateCourseDto
): Promise<CourseResponseDto> {
  try {
    const response = await axiosInstance.post<CourseResponseDto>(
      '/courses',
      data
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to create course'
      );
    }
    throw error;
  }
}

/**
 * Update a course
 */
export async function updateCourse(
  courseId: string,
  data: CreateCourseDto
): Promise<CourseResponseDto> {
  try {
    const response = await axiosInstance.patch<CourseResponseDto>(
      `/courses/${courseId}`,
      data
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to update course'
      );
    }
    throw error;
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(courseId: string): Promise<void> {
  try {
    await axiosInstance.delete(`/courses/${courseId}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to delete course'
      );
    }
    throw error;
  }
}

/**
 * Get all documents in a course
 */
export async function getCourseDocuments(
  courseId: string
): Promise<CourseDocumentResponseDto[]> {
  try {
    const response = await axiosInstance.get<CourseDocumentResponseDto[]>(
      `/courses/${courseId}/documents`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch course documents'
      );
    }
    throw error;
  }
}


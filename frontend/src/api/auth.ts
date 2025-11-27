import axiosInstance from './axiosInstance';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface SignupDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Sign up a new user
 */
export async function signup(dto: SignupDto): Promise<LoginResponse> {
  try {
    const response = await axiosInstance.post<LoginResponse>(
      '/auth/signup',
      dto
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to sign up'
      );
    }
    throw error;
  }
}

/**
 * Log in an existing user
 */
export async function login(dto: LoginDto): Promise<LoginResponse> {
  try {
    const response = await axiosInstance.post<LoginResponse>(
      '/auth/login',
      dto
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to log in'
      );
    }
    throw error;
  }
}

/**
 * Get current user info (validates token)
 */
export async function getMe(): Promise<User> {
  try {
    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to get user info'
      );
    }
    throw error;
  }
}


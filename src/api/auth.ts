import { apiClient } from './client';
import type { AuthResponse, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from '../types/auth';

export async function loginUser(dto: LoginDto): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', dto);
    return response.data;
  } catch (err: any) {
    if (err.response) {
      if (err.response.status === 401) {
        throw new Error(
          err.response.data?.message || 'Invalid credentials. Please check your phone number or password.',
        );
      }
      const serverMessage =
        err.response.data?.message || 'Authentication service unavailable. Please try again.';
      throw new Error(serverMessage);
    }
    throw new Error('Unable to connect to authentication service. Please check your network connection.');
  }
}

export async function registerUser(dto: RegisterDto): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', dto);
    return response.data;
  } catch (err: any) {
    if (err.response) {
      if (err.response.status === 409) {
        throw new Error(err.response.data?.message || 'An account with these details already exists.');
      }
      const serverMessage =
        err.response.data?.message || 'Failed to create account. Please check your details.';
      throw new Error(serverMessage);
    }
    throw new Error('Unable to connect to registration service. Please check your network connection.');
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  return response.data;
}

export async function requestPasswordReset(dto: ForgotPasswordDto): Promise<{ message: string; code?: string }> {
  try {
    const response = await apiClient.post<{ message: string; code?: string }>('/auth/forgot-password', dto);
    return response.data;
  } catch (err: any) {
    if (err.response) {
      const serverMessage = err.response.data?.message || 'Could not send verification code.';
      throw new Error(serverMessage);
    }
    throw new Error('Unable to request password reset code. Please check your network connection.');
  }
}

export async function resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
  try {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', dto);
    return response.data;
  } catch (err: any) {
    if (err.response) {
      const serverMessage = err.response.data?.message || 'Could not reset password.';
      throw new Error(serverMessage);
    }
    throw new Error('Unable to reset password. Please check your network connection.');
  }
}


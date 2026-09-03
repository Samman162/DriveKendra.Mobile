export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  avatarUrl?: string;
  role?: 'customer' | 'admin';
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginDto {
  identifier: string; // Phone number
  password: string;
}

export interface RegisterDto {
  name: string;
  phone: string;
  password: string;
  email?: string; // Optional: can be added in profile
}

export interface ForgotPasswordDto {
  identifier: string; // Email or Phone number
}

export interface ResetPasswordDto {
  identifier: string;
  code: string;
  newPassword: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  token: string; // Access token
  refreshToken?: string;
  message?: string;
}

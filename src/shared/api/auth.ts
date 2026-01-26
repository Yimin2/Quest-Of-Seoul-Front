import { API_URL } from './config';
import { fromZodError } from 'zod-validation-error';
import {
  AuthResponseSchema,
  RefreshTokenResponseSchema,
  type LoginRequest,
  type SignupRequest,
  type AuthResponse,
  type RefreshTokenResponse,
} from './schema';

export type { LoginRequest, SignupRequest, AuthResponse, RefreshTokenResponse };

export const authApi = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    const result = AuthResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('Login Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async signup(request: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Signup failed' }));
      throw new Error(error.detail || 'Signup failed');
    }

    const data = await response.json();
    const result = AuthResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('Signup Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async refresh(token: string): Promise<RefreshTokenResponse> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const result = RefreshTokenResponseSchema.safeParse(data);

     if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('Refresh Token Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },
};

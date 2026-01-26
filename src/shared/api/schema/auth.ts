import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  nickname: z.string().optional(),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  user_id: z.string(),
  email: z.string().email(),
  nickname: z.string().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const RefreshTokenResponseSchema = z.object({
  access_token: z.string(),
});

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

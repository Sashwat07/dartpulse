import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URL: z.string().min(1, "MONGODB_URL is required"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1, "NEXT_PUBLIC_APP_NAME is required"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URL: process.env.MONGODB_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});


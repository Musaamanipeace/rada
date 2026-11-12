import { z } from "zod";

const isTest = process.env.NODE_ENV === "test";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default(isTest ? "postgresql://postgres@localhost/rada?host=/tmp" : ""),
  AUTH_SECRET: z.string().min(16).default(isTest ? "test_secret_key_minimum_16_chars_long" : ""),
  FEATURE_WATCH_ADS_ENABLED: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  FEATURE_AUTOMATED_IMPORTS_ENABLED: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  AI_PROVIDER: z.string().default("none"),
  AI_API_KEY: z.string().optional().default(""),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  DATABASE_URL: process.env.DATABASE_URL || (isTest ? "postgresql://postgres@localhost/rada?host=/tmp" : undefined),
  AUTH_SECRET: process.env.AUTH_SECRET || (isTest ? "test_secret_key_minimum_16_chars_long" : undefined),
  FEATURE_WATCH_ADS_ENABLED: process.env.FEATURE_WATCH_ADS_ENABLED,
  FEATURE_AUTOMATED_IMPORTS_ENABLED: process.env.FEATURE_AUTOMATED_IMPORTS_ENABLED,
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_API_KEY: process.env.AI_API_KEY,
});

export const isWatchAdsEnabled = env.FEATURE_WATCH_ADS_ENABLED;

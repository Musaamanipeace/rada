import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  fields?: Record<string, string[]>
): NextResponse<ApiErrorShape> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status }
  );
}

export function handleZodError(err: ZodError): NextResponse<ApiErrorShape> {
  const fields: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "body";
    if (!fields[key]) fields[key] = [];
    fields[key].push(issue.message);
  }

  return apiError(
    "VALIDATION_ERROR",
    "Request input validation failed",
    400,
    fields
  );
}

// In-memory token bucket rate limiter for public endpoints
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count++;
  return { allowed: true, remaining: limit - existing.count };
}

// client\src\lib\api-utils.ts
'use server'
import { NextRequest, NextResponse } from "next/server";
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}
export function extractPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
export function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}
export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
export function checkRateLimit(key: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(key);

  if (!userLimit) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return true;
  }
  if (userLimit.count >= limit) {
    return false;
  }
  userLimit.count++;
  return true;
}
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
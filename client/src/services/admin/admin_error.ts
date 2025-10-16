'use client'
export async function handleService<T>(
  fn: () => Promise<T>,
  context: string,
  rethrow = false
): Promise<T | null> {
  try {
    return await fn();
  } catch (error: any) {
    console.error(`❌ [${context}]`, error?.message || error);
    if (rethrow) throw error;
    return null;
  }
}
export async function handleError(error: unknown): Promise<string> {
  if (!error) return "Unknown error occurred";

  if (typeof error === "string") return error;

  if (error instanceof Error) return error.message;

  if (typeof error === "object" && "message" in error) {
    return String((error as any).message);
  }

  return "An unexpected error occurred";
}
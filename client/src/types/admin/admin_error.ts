// ===== ERROR TYPES =====
export interface AdminError extends Error {
  code: string;
  context?: Record<string, unknown>;
}

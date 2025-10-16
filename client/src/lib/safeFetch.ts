export function safeSelect<T extends unknown[]>(
  response: { data: T | null; error: any },
  label: string,
  normalize?: (data: T) => T
): T {
  const { data, error } = response;

  if (error) {
    throw new Error(`${label} fetch failed: ${error.message}`);
  }

  if (data === null) {
    const empty = [] as unknown[]; // avoids never[]
    return normalize ? normalize(empty as T) : (empty as T);
  }

  if (!Array.isArray(data)) {
    throw new Error(`${label} returned non-array data`);
  }

  return normalize ? normalize(data) : data;
}
export function safeSingle<T>(
  response: { data: T | null; error: any },
  label: string,
  normalize?: (data: T) => T
): T | null {
  const { data, error } = response;

  if (error) {
    console.error(`${label} fetch failed: ${error.message}`);
    return null;
  }

  if (data === null || Array.isArray(data)) {
    console.warn(`${label} returned unexpected format`);
    return null;
  }

  return normalize ? normalize(data) : data;
}
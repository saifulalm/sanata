const DEFAULT_TIMEOUT_MS = 15000;

export class HttpRequestError extends Error {
  constructor(
    message: string,
    public kind: "network" | "timeout",
    public cause?: unknown
  ) {
    super(message);
  }
}

export async function fetchWithTimeout(input: string | URL | Request, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new HttpRequestError("Permintaan ke server melebihi batas waktu.", "timeout", error);
    }
    throw new HttpRequestError("Tidak dapat terhubung ke server.", "network", error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function readJsonSafely<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function isHttpRequestError(error: unknown): error is HttpRequestError {
  return error instanceof HttpRequestError;
}

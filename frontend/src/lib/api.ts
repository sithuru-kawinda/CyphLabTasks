const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiEnvelope<T> {
  data: T;
  meta?: { page: number; pageSize: number; total: number };
  error?: { message: string };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok) {
    throw new ApiError(res.status, body?.error?.message ?? "Something went wrong");
  }

  return (body as ApiEnvelope<T>).data;
}

/** For use in Client Components — the browser attaches the auth cookie automatically. */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  return parseResponse<T>(res);
}

/** For use in Server Components — forwards the incoming request's cookie manually. */
export async function serverApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { cookies } = await import("next/headers");
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...options.headers },
  });
  return parseResponse<T>(res);
}

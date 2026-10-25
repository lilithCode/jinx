export class ApiError extends Error {
  constructor(public status: number, message: string, public data: Record<string, unknown> = {}) {
    super(message);
  }
}

/** POST JSON to our API; throws ApiError with the server's friendly message. */
export async function api<T = Record<string, unknown>>(path: string, body: unknown = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach Jinx. Check your connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Something went wrong.", data);
  // Let the open jar refresh right away instead of waiting for the next poll.
  if (typeof window !== "undefined") window.dispatchEvent(new Event("jinx:changed"));
  return data as T;
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const inviteLink = (code: string) =>
  typeof window === "undefined" ? `/j/${code}` : `${window.location.origin}/j/${code}`;

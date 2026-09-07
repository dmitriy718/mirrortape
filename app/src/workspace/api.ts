export class ApiError extends Error {
  code: string;
  status: number;
  retryAfter: number;
  constructor(message: string, code: string, status: number, retryAfter = 0) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    csrf?: string;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.csrf ? { "X-CSRF-Token": options.csrf } : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      "Your connection was interrupted. Check your internet connection, then try again.",
      "NETWORK",
      0,
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    throw new ApiError(
      data?.error?.message ??
        "We could not complete this request. Please try again.",
      data?.error?.code ?? "UNAVAILABLE",
      response.status,
      Number(response.headers.get("Retry-After") ?? 0),
    );
  }
  return data as T;
}
export type Session = {
  csrf: string;
  user: {
    id: string;
    email: string | null;
    verified: boolean;
    authenticated: boolean;
  };
  features: {
    email: boolean;
    billing: boolean;
    alpaca: boolean;
    address: boolean;
  };
  storage: "server" | "cloud";
  termsUrl: string | null;
  privacyUrl: string | null;
};
export type Draft = {
  symbolInput: string;
  email: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  experience: "new" | "some" | "experienced";
  allocation: number;
  note: string;
  supportMessage: string;
  contactTopic:
    | "General"
    | "Account"
    | "Privacy"
    | "Accessibility"
    | "Security"
    | "Billing";
  supportRequestId: string;
  shareActivity: boolean;
  helpDismissed: boolean;
  step: number;
};
export type SavedDraft = {
  data: Draft;
  revision: number;
  savedAt: string | null;
};
export type WatchItem = {
  id: string;
  symbol: string;
  deleteAt: string | null;
  undoToken: string | null;
};
export type Watchlist = { items: WatchItem[]; serverTime: string };

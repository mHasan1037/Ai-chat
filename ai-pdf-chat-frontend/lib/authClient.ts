let accessToken: string | null = null;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const API_BASE_URL = BACKEND_URL;
const AUTH_BASE_URL = BACKEND_URL.replace(/\/api\/?$/, "");

type AccessTokenResponse = {
  accessToken: string;
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const createHeaders = (init?: RequestInit, token?: string | null) => {
  const headers = new Headers(init?.headers);

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
};

const readJson = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
};

export const publicAuthRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: createHeaders(init),
  });

  return readJson<T>(response);
};

export const refreshAccessToken = async () => {
  const data = await publicAuthRequest<AccessTokenResponse>("/auth/refresh", {
    method: "POST",
  });

  setAccessToken(data.accessToken);
  return data.accessToken;
};

const requestWithAccessToken = async <T>(
  url: string,
  init?: RequestInit,
  retry = true,
): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: createHeaders(init, accessToken),
  });

  if (response.status === 401 && retry) {
    try {
      await refreshAccessToken();
      return requestWithAccessToken<T>(url, init, false);
    } catch {
      setAccessToken(null);
    }
  }

  return readJson<T>(response);
};

export const authRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => requestWithAccessToken<T>(`${AUTH_BASE_URL}${path}`, init);

export const apiRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => requestWithAccessToken<T>(`${API_BASE_URL}${path}`, init);

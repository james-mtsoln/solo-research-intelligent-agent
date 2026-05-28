const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('rid_token');
}

async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new NetworkError(
      err instanceof Error ? err.message : 'Network error. Please check your connection.'
    );
  }

  if (response.status === 401) {
    localStorage.removeItem('rid_token');
    window.location.hash = '#/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function apiGet<T>(url: string): Promise<T> {
  return fetchWithAuth<T>(url, { method: 'GET' });
}

export function apiPost<T>(url: string, body: unknown): Promise<T> {
  return fetchWithAuth<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(url: string, body: unknown): Promise<T> {
  return fetchWithAuth<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function apiDelete<T>(url: string): Promise<T> {
  return fetchWithAuth<T>(url, { method: 'DELETE' });
}

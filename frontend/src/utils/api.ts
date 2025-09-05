// API utility for base URL and requests
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function apiUrl(path: string) {
  if (path.startsWith("/")) {
    path = path.slice(1);
  }
  return `${API_BASE_URL}/${path}`;
}

export async function apiFetch(path: string, options?: RequestInit) {
  const url = apiUrl(path);
  return fetch(url, options);
}

// API utility for base URL and requests
// Support Jest: fallback if import.meta.env is not available
let API_BASE_URL = "";
try {
  API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "";
} catch {
  const g = globalThis as any;
  if (typeof g.import !== "undefined" && g.import.meta && g.import.meta.env) {
    API_BASE_URL = g.import.meta.env.VITE_API_BASE_URL || "";
  }
}

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

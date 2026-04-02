/**
 * Central helper for all API calls.
 *
 * When NEXT_PUBLIC_API_URL is set (e.g. https://api.quiz.vin),
 * every request is routed to that external backend.
 * When the env-var is absent the app falls back to relative /api/* paths
 * which hit the built-in Next.js route handlers (for local dev without the
 * standalone backend).
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const defaultOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };
  return fetch(url, defaultOptions);
}

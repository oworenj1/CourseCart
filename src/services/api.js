
export const API_BASE_URL = "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("coursecart_token");
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot reach the CourseCart server. Check that the backend is running."
    );
  }

  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    if (token) {
      localStorage.removeItem("coursecart_token");
      localStorage.removeItem("coursecart_user");
      window.dispatchEvent(new Event("coursecart:session-expired"));
    }

    throw new Error(
      data?.message || "Your session has expired. Please log in again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed (${response.status}).`
    );
  }

  return data;
}

import { API_BASE_URL } from "./api";
import { getStoredToken } from "./authService";

// Shared request helper for the User Management endpoints.
const userRequest = async (path, options = {}) => {
  // User endpoints add the saved session token because they use direct fetch calls.
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "User Management request failed.");
  }

  return result;
};

// Load active accounts by default; the optional query asks the backend for archived ones too.
export const getUsers = async (includeArchived = false) => {
  const token = getStoredToken();
  const response = await fetch(
    `${API_BASE_URL}/users${includeArchived ? "?includeArchived=true" : ""}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Failed to load user accounts.");
  }

  return Array.isArray(result.users) ? result.users : [];
};

// Account changes are sent as JSON, with the response and errors passed back to useUsers.
export const createUser = (payload) =>
  userRequest("/users", { method: "POST", body: JSON.stringify(payload) });

export const updateUser = (id, payload) =>
  userRequest(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

export const archiveUser = (id) =>
  userRequest(`/users/${id}/archive`, { method: "PATCH" });

export const restoreUser = (id) =>
  userRequest(`/users/${id}/restore`, { method: "PATCH" });

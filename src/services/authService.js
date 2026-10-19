import { API_BASE_URL } from "./api";

const TOKEN_KEY = "coursecart_token";
const USER_KEY = "coursecart_user";

// These helpers keep browser session storage in one place for the auth hook.
export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const storeSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const storeUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Checks the saved token with the backend and returns the signed-in user.
export const fetchCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.user?.id) {
    throw new Error("Your session is no longer valid.");
  }

  return result.user;
};

// Sends the login form to the backend and returns { token, user } for useAuth to save.
export const loginRequest = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Login failed. Please try again.");
  }

  if (!result.token || !result.user?.id) {
    throw new Error("The server returned an incomplete login response.");
  }

  return result;
};

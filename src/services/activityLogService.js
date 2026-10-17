import { API_BASE_URL } from "./api";
import { getStoredToken } from "./authService";

export const getActivityLogs = async (limit = 250) => {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/activity-logs?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Failed to load activity logs.");
  }

  return Array.isArray(result.logs) ? result.logs : [];
};

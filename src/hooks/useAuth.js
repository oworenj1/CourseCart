import { useCallback, useEffect, useState } from "react";
import {
  clearSession,
  clearStoredUser,
  fetchCurrentUser,
  getStoredToken,
  loginRequest,
  storeSession,
  storeUser,
} from "../services/authService";

// Login, session check, and logout.
export function useAuth() {
  const [authUser, setAuthUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // When the app opens, check that any saved login is still valid.
  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      const token = getStoredToken();

      if (!token) {
        clearStoredUser();
        setAuthChecking(false);
        return;
      }

      try {
        const user = await fetchCurrentUser(token);

        if (!cancelled) {
          setAuthUser(user);
          storeUser(user);
        }
      } catch {
        clearSession();

        if (!cancelled) {
          setAuthUser(null);
          setLoginError("Your session expired. Please log in again.");
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");

    const email = loginEmail.trim().toLowerCase();

    if (!email || !loginPassword) {
      setLoginError("Enter your email and password.");
      return;
    }

    setLoginLoading(true);

    try {
      const result = await loginRequest(email, loginPassword);

      storeSession(result.token, result.user);
      setAuthUser(result.user);
      setLoginPassword("");
    } catch (error) {
      setLoginError(
        error.message === "Failed to fetch"
          ? "Cannot reach the CourseCart server. Make sure the backend is running on port 5000."
          : error.message || "Unable to log in.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Returns true when the user confirmed and was logged out.
  const logout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");

    if (!confirmed) return false;

    clearSession();
    setAuthUser(null);
    setLoginPassword("");
    setLoginError("");
    return true;
  };

  // Called when the backend says the saved login is no longer valid.
  const expireSession = useCallback(() => {
    setAuthUser(null);
    setLoginPassword("");
    setLoginError("Your session expired. Please log in again.");
  }, []);

  return {
    authUser,
    authChecking,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginLoading,
    loginError,
    handleLogin,
    logout,
    expireSession,
  };
}

import { useState } from "react";

// Login form UI; authentication and saved-session work are handled by useAuth in App.
function Login({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  loginLoading,
  handleLogin,
}) {
  // This local toggle changes only whether the password characters are visible.
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "linear-gradient(135deg, #eef4ff 0%, #f8fafc 55%, #e7f7f0 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box",
          padding: 32,
          borderRadius: 20,
          background: "#ffffff",
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.12)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 26,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              borderRadius: 20,
              background: "#ffffff",
              boxShadow: "0 6px 18px rgba(37, 99, 235, 0.12)",
            }}
          >
            <img
              src="/coursecart-logo.png"
              alt="CourseCart Logo"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: 20,
              }}
            />
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <h1 style={{ margin: 0, color: "#0f172a", fontSize: 27 }}>
              CourseCart
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              School Supplies POS &amp; Inventory
            </p>
          </div>
        </div>

        <h2 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: 22 }}>
          Welcome back
        </h2>
        <p style={{ margin: "0 0 22px", color: "#64748b", fontSize: 14 }}>
          Sign in to continue to your workspace.
        </p>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
          <label
            style={{
              display: "grid",
              gap: 7,
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Email address
            <input
              type="email"
              autoComplete="username"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="you@example.com"
              required
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: "12px 13px",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                fontSize: 15,
                outlineColor: "#2563eb",
              }}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 7,
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Password
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  padding: "12px 46px 12px 13px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  fontSize: 15,
                  outlineColor: "#2563eb",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 8,
                  transform: "translateY(-50%)",
                  display: "grid",
                  placeItems: "center",
                  width: 32,
                  height: 32,
                  padding: 0,
                  border: 0,
                  borderRadius: 7,
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11.8 11.8 0 01-3.1 4.3" />
                    <path d="M6.6 6.6A12 12 0 002.5 12c1 2.5 4.5 7 9.5 7a10.5 10.5 0 004-.8" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {loginError && (
            <p
              role="alert"
              style={{
                margin: 0,
                padding: "10px 12px",
                borderRadius: 9,
                color: "#b91c1c",
                background: "#fef2f2",
                fontSize: 13,
              }}
            >
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            style={{
              marginTop: 4,
              padding: "13px 16px",
              border: 0,
              borderRadius: 10,
              background: loginLoading ? "#93c5fd" : "#2563eb",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loginLoading ? "wait" : "pointer",
            }}
          >
            {loginLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p
          style={{
            margin: "20px 0 0",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: 12,
          }}
        >
          Authorized CourseCart users only
        </p>
      </section>
    </main>
  );
}

export default Login;

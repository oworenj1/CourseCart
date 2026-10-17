function Login({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  loginLoading,
  handleLogin,
}) {
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
              width: 48,
              height: 48,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: "#2563eb",
              color: "#fff",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <div>
            <h1 style={{ margin: 0, color: "#0f172a", fontSize: 26 }}>
              CourseCart
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              School Supplies POS & Inventory
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
            <input
              type="password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="Enter your password"
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

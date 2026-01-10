// src/app/App.tsx


import { Link, useLocation } from "react-router-dom";
import AppRoutes from "./routes";
import { PAGES } from "./pages.registry";

export default function App() {
  const loc = useLocation();
  const enabled = PAGES.filter((p) => p.enabled);

  return (
    <div style={{ minHeight: "100vh" }}>
      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          gap: 12,
          padding: "10px 12px",
          borderRadius: 14,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          zIndex: 9999,
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ fontWeight: 700 }}>CT STUDIO</div>
        <div style={{ display: "flex", gap: 10 }}>
          {enabled.map((p) => (
            <Link
              key={p.key}
              to={p.path}
              style={{
                color: loc.pathname === p.path ? "#fff" : "rgba(255,255,255,0.75)",
                textDecoration: "none",
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: 10,
                background:
                  loc.pathname === p.path
                    ? "rgba(255,255,255,0.14)"
                    : "transparent",
              }}
            >
              {p.title}
            </Link>
          ))}
        </div>
      </div>

      <AppRoutes />
    </div>
  );
}

// src/app/routes.tsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PAGES } from "./pages.registry";

export default function AppRoutes() {
  const enabled = PAGES.filter((p) => p.enabled);

  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <Routes>
        {enabled.map((p) => (
          <Route key={p.key} path={p.path} element={<p.Component />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

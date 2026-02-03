"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type LoadingContextValue = {
  loading: boolean;
  setLoading: (value: boolean) => void;
};

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const value = useMemo(() => ({ loading, setLoading }), [loading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "16px 20px",
              borderRadius: 10,
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              fontSize: 14,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Saving...
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within LoadingProvider");
  }
  return ctx;
}

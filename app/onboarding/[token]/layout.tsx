"use client";

import { ReactNode, useEffect, useState } from "react";
import OnboardingHeader from "../../components/onboarding/OnboardingHeader";
import { useParams } from "next/navigation";

type OnboardingLayoutProps = {
  children: ReactNode;
  params: {
    token: string;
  };
};

export default function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  const { token } = useParams();

  /**
   * ✅ Initial state is DERIVED, not set in useEffect
   * - null  → verifying
   * - false → token missing or invalid
   * - true  → valid
   */
  const [isValid, setIsValid] = useState<boolean | null>(
    token ? null : false
  );
console.log("OnboardingLayout token:", token);
  useEffect(() => {
    // ⛔ No token → nothing to verify
    if (!token) return;

    let cancelled = false;

    const verifyToken = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/verify_token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw_token: token }),
            cache: "no-store",
          }
        );

        if (!cancelled) {
          setIsValid(res.ok);
        }
      } catch {
        if (!cancelled) {
          setIsValid(false);
        }
      }
    };

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  /* ---------- LOADING ---------- */
  if (isValid === null) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        Verifying onboarding link...
      </div>
    );
  }

  /* ---------- INVALID ---------- */
  if (isValid === false) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "red",
          fontSize: 18,
        }}
      >
        Invalid or expired onboarding link
      </div>
    );
  }

  /* ---------- VALID ---------- */
  return (
    <>
      <OnboardingHeader />
      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        {children}
      </main>
    </>
  );
}

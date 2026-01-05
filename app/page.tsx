"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OnboardingEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // 👇 derive initial state from token
  const [status, setStatus] = useState<"loading" | "invalid">(
    token ? "loading" : "invalid"
  );

  useEffect(() => {
    if (!token) return;

    const verifyAndRedirect = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/verify_token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw_token: token }),
          }
        );

        if (res.ok) {
          router.replace(`/onboarding/${token}`);
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };

    verifyAndRedirect();
  }, [token, router]);

  /* ---------------- UI ---------------- */
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      {status === "loading" && (
        <p style={{ fontSize: 16 }}>Verifying onboarding link…</p>
      )}

      {status === "invalid" && (
        <>
          <h2 style={{ color: "red", marginBottom: 8 }}>
            Invalid or Expired Link
          </h2>
          <p style={{ color: "#555" }}>
            The onboarding link you used is no longer valid.
            <br />
            Please contact HR for a new link.
          </p>
        </>
      )}
    </div>
  );
}




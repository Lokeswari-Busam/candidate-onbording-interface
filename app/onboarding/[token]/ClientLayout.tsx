"use client";

import OnboardingSidebar from "@/app/components/onboarding/OnboardingSidebar";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_CONFIG } from "@/app/utils/apiConfig";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string | undefined;
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;

    const cacheKey = `token-verified-${token}`;
    if (sessionStorage.getItem(cacheKey) === "true") {
      setTokenValid(true);
      return;
    }

    // GET endpoint is non-destructive (safe to call multiple times).
    // POST /verify_token marks the token as initiated and returns 500 on repeat calls.
    fetch(`${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/token-verification/${token}`)
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem(cacheKey, "true");
          setTokenValid(true);
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [token, router]);

  if (tokenValid === null) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 16, color: "#64748b" }}>Verifying onboarding link…</p>
      </div>
    );
  }
  const isWelcomePage = pathname.endsWith("/welcome");
  const isSuccessPage = pathname.endsWith("/success");

  /* Welcome page and OTP/email page both render without the chrome */
  const isFullscreenPage =
    isWelcomePage ||
    isSuccessPage ||
    /\/onboarding\/[^/]+$/.test(pathname); /* matches /onboarding/[token] exactly */

  if (isFullscreenPage) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: "#f8fafc",
    }}>
      {/* Sidebar */}
      <OnboardingSidebar />

      {/* Content column */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
        minHeight: 0,  /* prevent flex item from expanding beyond parent */
      }}>
        <OnboardingHeader />

        <main style={{
          flex: 1,
          minHeight: 0,  /* required: lets flex child shrink and own its overflow */
          overflowY: "auto",
          overflowX: "hidden",
          padding: "24px 32px 20px",
          background: "#f8fafc",
        }}>
          <div className="ob-content" style={{ maxWidth: "900px", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

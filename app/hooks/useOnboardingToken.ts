"use client";
import { usePathname } from "next/navigation";

// useParams() returns '__' (the static build-time placeholder) in production because
// CloudFront rewrites RSC payload requests from /onboarding/<real-token>/... to
// /onboarding/__/... so Next.js reads '__' from the pre-built payload.
// window.location.pathname always reflects the real browser URL.
export function useOnboardingToken(): string | undefined {
  usePathname(); // subscribe to URL changes so callers re-render on navigation
  if (typeof window === "undefined") return undefined;
  const match = window.location.pathname.match(/^\/onboarding\/([^/]+)/);
  const token = match?.[1];
  return token === "__" ? undefined : token;
}

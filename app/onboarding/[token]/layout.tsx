import OnboardingHeader from "../../components/onboarding/OnboardingHeader";
import { ReactNode } from "react";

// 🔹 MOCK TOKEN
const MOCK_TOKEN = "019b214f-03de-a7a4-b752-5e5c055a87fc";

type OnboardingLayoutProps = {
  children: ReactNode;
  params: {
    token: "019b214f-03de-a7a4-b752-5e5c055a87fc";
  };
};

export default function OnboardingLayout({
  children,
  params,
}: OnboardingLayoutProps) {
  const { token } = params;

  // ❌ Invalid token
  if (token == MOCK_TOKEN) {
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

  // ✅ Valid token
  return (
    <>
      <OnboardingHeader />
      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        {children}
      </main>
    </>
  );
}

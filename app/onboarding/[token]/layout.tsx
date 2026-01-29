import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Stepper + Header visible on all onboarding pages */}
      <OnboardingHeader />

      {/* Page content */}
      <main className="pt-6">{children}</main>
    </div>
  );
}

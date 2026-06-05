import { Suspense } from "react";
import ClientLayout from "./ClientLayout";

export function generateStaticParams() {
  return [{ token: '__' }];
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <ClientLayout>{children}</ClientLayout>
    </Suspense>
  );
}

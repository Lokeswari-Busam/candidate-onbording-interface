// src/app/onboarding/[token]/page.jsx


export default function OnboardingLayout({ params }) {
  return (
    <div>
      <h2>Welcome to Employee Onboarding</h2>
      <p>Your token is valid.</p>
      <p>Token: <strong>{params.token}</strong></p>
    </div>
  );
}

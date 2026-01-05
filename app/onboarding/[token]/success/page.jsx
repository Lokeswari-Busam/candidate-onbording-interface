export default function SuccessPage() {
  return (
    <div
      style={{
        height: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 12 }}>
        🎉 Onboarding Submitted Successfully
      </h2>

      <p style={{ fontSize: 16, color: "#555", maxWidth: 420 }}>
        Thank you for completing your onboarding.
        Our HR team will review your details and get back to you.
      </p>
    </div>
  );
}

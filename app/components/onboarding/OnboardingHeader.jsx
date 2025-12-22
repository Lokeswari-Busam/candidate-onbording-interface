"use client";

import { usePathname, useRouter } from "next/navigation";
import { steps } from "./steps";

export default function OnboardingHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const currentStepIndex = steps.findIndex(step =>
    pathname.includes(step.path)
  );

  return (
    <header
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "16px 0",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        {/* Step title */}
        {currentStepIndex >= 0 && (
          <div style={{ marginBottom: 12, fontSize: 14, color: "#1f2937" }}>
            <strong>
              Step {currentStepIndex + 1} of {steps.length}:
            </strong>{" "}
            {steps[currentStepIndex].label}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  cursor: isFuture ? "not-allowed" : "pointer",
                }}
                onClick={() => {
                  if (!isFuture) {
                    router.push(step.path);
                  }
                }}
              >
                {/* Circle */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor:
                      isCompleted || isCurrent ? "#2563eb" : "#e5e7eb",
                    color:
                      isCompleted || isCurrent ? "#ffffff" : "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    border: isCurrent ? "2px solid #2563eb" : "none",
                  }}
                >
                  {isCompleted ? "✓" : step.id}
                </div>

                {/* Label */}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 13,
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCompleted
                      ? "#111827"
                      : isCurrent
                      ? "#2563eb" // 🔵 CURRENT STEP BLUE
                      : "#9ca3af",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.label}
                </span>

                {/* Line */}
                {index !== steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor: isCompleted
                        ? "#2563eb"
                        : "#e5e7eb",
                      margin: "0 12px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}

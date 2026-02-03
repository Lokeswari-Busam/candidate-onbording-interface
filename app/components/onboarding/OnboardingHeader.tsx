"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { steps } from "./steps";

export default function OnboardingHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useParams();

  const currentStepIndex = steps.findIndex((step) =>
    pathname.endsWith(step.path)
  );

  const safeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  const progressPercent = Math.round(
    (safeIndex / (steps.length - 1)) * 100
  );

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 space-y-4">

        {/* ───────── TOP BAR ───────── */}
        <div className="flex items-center justify-between">
          {/* LEFT: STEP INFO */}
          <div className="text-sm text-gray-700">
            <span className="font-semibold">
              Step {safeIndex + 1} of {steps.length}
            </span>
            {" · "}
            <span className="text-blue-600 font-medium">
              {steps[safeIndex]?.label}
            </span>
          </div>

          {/* RIGHT: SHORT PROGRESS BAR */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-700">
              {progressPercent}%
            </span>
            <div className="w-49 h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-700 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* ───────── STEPS NAVIGATION (DOWN) ───────── */}
        <div className="flex items-center justify-between pt-2">
          {steps.map((step, index) => {
            const isCompleted = index < safeIndex;
            const isCurrent = index === safeIndex;
            const isFuture = index > safeIndex;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* STEP CIRCLE */}
                <button
                  disabled={isFuture}
                  onClick={() =>
                    !isFuture &&
                    router.push(`/onboarding/${token}/${step.path}`)
                  }
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                    ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : isCurrent
                        ? "border-2 border-blue-600 text-blue-600 bg-white"
                        : "bg-gray-300 text-gray-500"
                    }
                  `}
                >
                  {isCompleted ? "✓" : step.id}
                </button>

                {/* LABEL */}
                <span
                  className={`ml-2 text-xs whitespace-nowrap
                    ${
                      isCurrent
                        ? "text-blue-600 font-semibold"
                        : isCompleted
                        ? "text-gray-800"
                        : "text-gray-400"
                    }
                  `}
                >
                  {step.label}
                </span>

                {/* CONNECTOR */}
                {index !== steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3
                      ${
                        isCompleted
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }
                    `}
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

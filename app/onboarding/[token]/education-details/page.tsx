"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLocalStorageForm } from "../hooks/localStorage";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";
import { EDUCATION_HIERARCHY } from "./constants";
import EducationModal from "./EducationModal";
import EducationTimeline from "./EducationTimeline";
import {
  createEducationDocument,
  updateEducationDocument,
} from "./educationApi";
import {
  buildBackendDraftByLevel,
  groupRows,
  hasEducationChanged,
  isEmptyValue,
  mergeBackendAndLocal,
  normalizeDraft,
} from "./educationUtils";
import type { CommonForm, Education, UploadedDoc } from "./types";
import { useEducationData } from "./useEducationData";

export default function EducationDetailsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setLoading: setGlobalLoading } = useGlobalLoading();

  // Fetch nationality_country_uuid from personal details localStorage
  const [countryUuid, setCountryUuid] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    try {
      const personalDetails = localStorage.getItem(`personal-details-${token}`);
      if (personalDetails) {
        const parsed = JSON.parse(personalDetails);
        if (parsed.nationality_country_uuid) {
          setCountryUuid(parsed.nationality_country_uuid);
        } else {
          setError(
            "Please complete Personal Details first to set your nationality",
          );
        }
      } else {
        setError("Please complete Personal Details first");
      }
    } catch {
      setError("Failed to load country information from personal details");
    }
  }, [token]);

  const { rows, uploadedMap, setUploadedMap, userUuid } = useEducationData({
    base,
    token,
    countryUuid: countryUuid || "",
    onError: setError,
  });

  // ✅ ALL HOOKS MUST BE CALLED HERE (UNCONDITIONALLY)
  const grouped = useMemo(() => groupRows(rows), [rows]);

  const [educationDetails, setEducationDetails] = useLocalStorageForm<
    Education[]
  >(`education-details-${token}`, []);

  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  const [form, setForm] = useState<CommonForm>({
    institution_name: "",
    specialization: "",
    year_of_passing: "",
    percentage_cgpa: "",
  });

  const [files, setFiles] = useState<Record<string, File | null>>({});

  // ✅ Reset form state when token changes to prevent data bleed
  useEffect(() => {
    setActiveLevel(null);
    setForm({
      institution_name: "",
      specialization: "",
      year_of_passing: "",
      percentage_cgpa: "",
    });
    setFiles({});
    setError("");
  }, [token]);

  const activeRows = activeLevel ? (grouped[activeLevel] ?? []) : [];

  const backendDraftByLevel = useMemo(
    () => buildBackendDraftByLevel(rows, uploadedMap),
    [rows, uploadedMap],
  );

  const orderedDrafts = useMemo(() => {
    const hasRealUpload = Object.keys(uploadedMap).length > 0;
    if (!userUuid || !hasRealUpload) return [];
    const merged = mergeBackendAndLocal(backendDraftByLevel, educationDetails);
    return [...merged].sort((a, b) => {
      const aIndex = EDUCATION_HIERARCHY.indexOf(a.education_name);
      const bIndex = EDUCATION_HIERARCHY.indexOf(b.education_name);
      if (aIndex === -1 && bIndex === -1) {
        return a.education_name.localeCompare(b.education_name);
      }
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [backendDraftByLevel, educationDetails, userUuid, uploadedMap]);

  const draftByLevel = useMemo(() => {
    const map: Record<string, Education> = {};
    orderedDrafts.forEach((draft) => {
      map[draft.education_name] = draft;
    });
    return map;
  }, [orderedDrafts]);

  // useEffect(() => {
  //   if (orderedDrafts.length === 0 && educationDetails.length === 0) return;
  //   const next = JSON.stringify(orderedDrafts);
  //   const current = JSON.stringify(educationDetails);
  //   if (next !== current) {
  //     setEducationDetails(orderedDrafts);
  //   }
  // }, [orderedDrafts, educationDetails, setEducationDetails]);

  useEffect(() => {
    // ❌ DO NOT auto-write when there is no real education for this candidate
    if (!userUuid) return;

    // If local storage empty AND no backend docs → do nothing
    if (educationDetails.length === 0 && orderedDrafts.length === 0) return;

    const next = JSON.stringify(orderedDrafts);
    const current = JSON.stringify(educationDetails);

    if (next !== current) {
      setEducationDetails(orderedDrafts);
    }
  }, [orderedDrafts, educationDetails, setEducationDetails, userUuid]);

  // ✅ NOW WE CAN CHECK AND CONDITIONALLY RENDER
  if (countryUuid === null) {
    return (
      <div style={pageWrapper}>
        <div style={cardStyle}>
          <p>Loading education details...</p>
        </div>
      </div>
    );
  }

  if (error && countryUuid === null) {
    return (
      <div style={pageWrapper}>
        <div style={cardStyle}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  const openLevel = (level: string) => {
    const draft = draftByLevel[level];
    setActiveLevel(level);
    setForm({
      institution_name: draft?.institution_name || "",
      specialization: draft?.specialization || "",
      year_of_passing: draft?.year_of_passing || "",
      percentage_cgpa: draft?.percentage_cgpa || "",
    });
    setFiles({});
    setError("");
  };

  const handleSave = async () => {
    if (!activeLevel) return;
    if (!userUuid) {
      setError("User not initialized. Please reload the page.");
      return;
    }
    /* ===================== COMMON FIELD VALIDATION ===================== */
    if (
      isEmptyValue(form.institution_name) ||
      isEmptyValue(form.specialization) ||
      isEmptyValue(form.year_of_passing) ||
      isEmptyValue(form.percentage_cgpa)
    ) {
      setError("Please fill all common fields");
      return;
    }

    /* ===================== MANDATORY DOC CHECK ===================== */
    const missingMandatory = activeRows.find(
      (r) =>
        r.is_mandatory &&
        !files[r.mapping_uuid] &&
        !uploadedMap[r.mapping_uuid],
    );

    if (missingMandatory) {
      setError(
        `Please upload required document: ${missingMandatory.document_name}`,
      );
      return;
    }

    /* ===================== HIERARCHY VALIDATION (ONCE) ===================== */
    const currentIndex = EDUCATION_HIERARCHY.indexOf(activeLevel);

    if (currentIndex > 0) {
      for (let i = 0; i < currentIndex; i++) {
        const requiredLevel = EDUCATION_HIERARCHY[i];
        const levelRows = grouped[requiredLevel] || [];

        const isFilled = levelRows.every(
          (row) => uploadedMap[row.mapping_uuid],
        );

        if (!isFilled) {
          setError(
            `Please complete ${requiredLevel} details before adding ${activeLevel}`,
          );
          return;
        }
      }
    }

    /* ===================== SAVE ===================== */
    setLoading(true);
    setGlobalLoading(true);
    setError("");

    try {
      let nextUploadedMap = { ...uploadedMap };
      let hasAnyChange = false;
      for (const row of activeRows) {
        const file = files[row.mapping_uuid];
        const existing = nextUploadedMap[row.mapping_uuid];

        if (!file && !existing) continue;

        const payload = new FormData();
        payload.append("mapping_uuid", row.mapping_uuid);
        payload.append("user_uuid", userUuid);
        payload.append("institution_name", form.institution_name);
        payload.append("specialization", form.specialization);
        payload.append("year_of_passing", form.year_of_passing);
        payload.append("percentage_cgpa", form.percentage_cgpa);
        if (file) payload.append("file", file);

        /* ========== 1️⃣ CREATE ========== */
        if (!existing) {
          hasAnyChange = true;

          const saved: UploadedDoc = await createEducationDocument(
            base,
            payload,
          );
          nextUploadedMap = {
            ...nextUploadedMap,
            [row.mapping_uuid]: saved,
          };
          toast.success("Education document uploaded successfully");
        } else if (hasEducationChanged(existing, form, file)) {
          /* ========== 2️⃣ UPDATE ========== */
          hasAnyChange = true;
          const updated: UploadedDoc = await updateEducationDocument(
            base,
            existing.document_uuid,
            payload,
          );

          nextUploadedMap = {
            ...nextUploadedMap,
            [row.mapping_uuid]: updated,
          };
          toast.success("Education document updated successfully");
        } else {
          /* ========== 3️⃣ NO CHANGE ========== */
          // skip
        }
      }
      if (!hasAnyChange) {
        toast.success("No changes to save");
      }

      setUploadedMap(nextUploadedMap);

      // ✅ SAVE TO LOCAL STORAGE FOR PREVIEW PAGE
      setEducationDetails((prev) => {
        const filtered = prev.filter((e) => e.education_name !== activeLevel);
        const nextDraft: Education = normalizeDraft({
          education_name: activeLevel!,
          institution_name: form.institution_name,
          specialization: form.specialization,
          year_of_passing: form.year_of_passing,
          percentage_cgpa: form.percentage_cgpa,
          documents: activeRows.map((row) => {
            const doc = nextUploadedMap[row.mapping_uuid];
            return {
              document_name: row.document_name,
              file_path: doc?.file_path,
            };
          }),
        });

        return [...filtered, nextDraft];
      });

      /* ===================== RESET ===================== */
      setActiveLevel(null);
      setFiles({});
    } catch {
      setError("Failed to save documents");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-8 text-xl font-semibold ">Education Details</h2>

        <EducationTimeline
          grouped={grouped}
          uploadedMap={uploadedMap}
          draftByLevel={draftByLevel}
          onOpenLevel={openLevel}
        />

        <EducationModal
          activeLevel={activeLevel}
          form={form}
          activeRows={activeRows}
          files={files}
          uploadedMap={uploadedMap}
          error={error}
          loading={loading}
          onFormChange={(patch) =>
            setForm((prev) => ({
              ...prev,
              ...patch,
            }))
          }
          onFileChange={(mappingUuid, file) =>
            setFiles((prev) => ({
              ...prev,
              [mappingUuid]: file,
            }))
          }
          onCancel={() => setActiveLevel(null)}
          onSave={handleSave}
        />

        <div className="mt-10 flex justify-between">
          <button
            onClick={() => router.push(`/onboarding/${token}/identity-details`)}
            className="rounded-lg bg-slate-200 px-5 py-2 text-sm"
          >
            ← Back
          </button>

          <button
            onClick={() =>
              router.push(`/onboarding/${token}/experience-details`)
            }
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm text-white"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== STYLES ===================== */

const pageWrapper = {
  padding: "32px 0",
  background: "#f5f7fb",
  minHeight: "100vh",
};

const cardStyle = {
  maxWidth: 720,
  margin: "auto",
  background: "#fff",
  padding: 24,
  borderRadius: 8,
};

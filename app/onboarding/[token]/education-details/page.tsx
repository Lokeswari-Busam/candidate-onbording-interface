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
  groupRows,
  hasEducationChanged,
  isEmptyValue,
  normalizeDraft,
} from "./educationUtils";
import type { CommonForm, Education, UploadedDoc } from "./types";
import { useEducationData } from "./useEducationData";
import {
  createEducationDocument,
  updateEducationDocument,
} from "./educationApi";

export default function EducationDetailsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mappingLoaded, setMappingLoaded] = useState(false);
  const { setLoading: setGlobalLoading } = useGlobalLoading();

  // Fetch nationality_country_uuid from personal details localStorage
  const [countryUuid, setCountryUuid] = useState<string | null>(null);
  const [countryUuidLoaded, setCountryUuidLoaded] = useState(false);

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
    } finally {
      setCountryUuidLoaded(true);
    }
  }, [token]);

  const { rows, uploadedMap: backendUploadedMap, setUploadedMap: setBackendUploadedMap, userUuid } = useEducationData({
    base,
    token,
    countryUuid: countryUuid || "",
    onError: setError,
  });

  // ✅ Mark mapping as loaded once we have rows or if countryUuid is not available
  useEffect(() => {
    if (countryUuid && rows.length > 0) {
      setMappingLoaded(true);
    } else if (countryUuid && error) {
      // If we have countryUuid and an error occurred, mapping is also loaded (with error)
      setMappingLoaded(true);
    } else if (!countryUuid && countryUuidLoaded) {
      // If no countryUuid after loading, mapping is not applicable
      setMappingLoaded(true);
    }
  }, [rows, countryUuid, error, countryUuidLoaded]);

  // ✅ ALL HOOKS MUST BE CALLED HERE (UNCONDITIONALLY)
  const grouped = useMemo(() => groupRows(rows), [rows]);

  // ✅ Load education details from localStorage ONLY (not from backend)
  const [educationDetails, setEducationDetails] = useLocalStorageForm<
    Education[]
  >(`education-details-${token}`, []);

  // ✅ Load and persist uploadedMap to localStorage
  const [uploadedMap, setUploadedMapState] = useState<Record<string, UploadedDoc>>({});

  useEffect(() => {
    if (!token) return;
    try {
      const stored = localStorage.getItem(`uploaded-docs-${token}`);
      if (stored) {
        setUploadedMapState(JSON.parse(stored));
      } else {
        setUploadedMapState({});
      }
    } catch {
      setUploadedMapState({});
    }
  }, [token]);

  // ✅ Merge backend uploadedMap with localStorage on initial load
  useEffect(() => {
    if (Object.keys(backendUploadedMap).length > 0) {
      const merged = { ...uploadedMap, ...backendUploadedMap };
      setUploadedMapState(merged);
    }
  }, [backendUploadedMap]);

  const setUploadedMap = (value: Record<string, UploadedDoc> | ((prev: Record<string, UploadedDoc>) => Record<string, UploadedDoc>)) => {
    setUploadedMapState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      // Persist to localStorage
      try {
        localStorage.setItem(`uploaded-docs-${token}`, JSON.stringify(next));
      } catch {
        console.error("Failed to save uploaded docs to localStorage");
      }
      return next;
    });
  };

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
    // Also reset uploadedMap from localStorage when token changes
    try {
      const stored = localStorage.getItem(`uploaded-docs-${token}`);
      if (stored) {
        setUploadedMapState(JSON.parse(stored));
      } else {
        setUploadedMapState({});
      }
    } catch {
      setUploadedMapState({});
    }
  }, [token]);

  const activeRows = activeLevel ? (grouped[activeLevel] ?? []) : [];

  // ✅ Create lookup map for localStorage education details
  const draftByLevel = useMemo(() => {
    const map: Record<string, Education> = {};
    educationDetails.forEach((draft) => {
      map[draft.education_name] = draft;
    });
    return map;
  }, [educationDetails]);

  // ✅ NOW WE CAN CHECK AND CONDITIONALLY RENDER
  if (!countryUuidLoaded || !mappingLoaded) {
    return (
      <div style={pageWrapper}>
        <div style={cardStyle}>
          <p>Loading education details...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

    /* ===================== HIERARCHY VALIDATION ===================== */
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

    /* ===================== SAVE TO BACKEND + LOCALSTORAGE ===================== */
    setLoading(true);
    setGlobalLoading(true);
    setError("");

    try {
      let nextUploadedMap = { ...uploadedMap };
      let hasAnyChange = false;

      // ✅ STEP 1: Upload/Update documents to backend
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

      // ✅ STEP 2: SAVE TO LOCAL STORAGE (always, for form data persistence)
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

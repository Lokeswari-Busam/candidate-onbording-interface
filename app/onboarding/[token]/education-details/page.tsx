"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorageForm } from "../hooks/localStorage";

type MappingRow = {
  mapping_uuid: string;
  education_name: string;
  document_name: string;
  is_mandatory: boolean;
};

type UploadedDoc = {
  document_uuid: string;
  mapping_uuid: string;
  institution_name: string;
  specialization: string;
  year_of_passing: number;
  file_path: string;
  status: string;
};

type CommonForm = {
  institution_name: string;
  specialization: string;
  year_of_passing: string;
  percentage_cgpa: string;
};

type EducationDraft = {
  activeLevel: string | null;
  form: CommonForm;
  filesMeta: Record<string, string>; // mapping_uuid -> filename
};


export default function EducationDetailsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const country_uuid = "019a8135-42fc-17ed-4825-f5a4634898fb";

  const [rows, setRows] = useState<MappingRow[]>([]);
  const [uploadedMap, setUploadedMap] = useState<Record<string, UploadedDoc>>(
    {}
  );

  const [draft, setDraft] = useLocalStorageForm<EducationDraft>(
  `education-details-${token}`,
  {
    activeLevel: null,
    form: {
      institution_name: "",
      specialization: "",
      year_of_passing: "",
      percentage_cgpa: "",
    },
    filesMeta: {},
  }
);

const activeLevel = draft.activeLevel;
const form = draft.form;

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userUuid, setUserUuid] = useState("");

  

  /* -------- Fetch User UUID -------- */
  useEffect(() => {
    if (!token) return;

    fetch(`${base}/token-verification/${token}`)
      .then((res) => res.json())
      .then((uuid: string) => setUserUuid(uuid))
      .catch(() => setError("Invalid onboarding link"));
  }, [base, token]);

  /* -------- Fetch Education Mapping -------- */
  useEffect(() => {
    fetch(`${base}/education/country-mapping/${country_uuid}`)
      .then((res) => res.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load education mapping"));
  }, [base, country_uuid]);

  /* -------- Fetch Uploaded Docs -------- */
  useEffect(() => {
    if (!token) return;

    fetch(`${base}/education/employee-education-document?token=${token}`)
      .then((res) => res.json())
      .then((docs: UploadedDoc[]) => {
        const map: Record<string, UploadedDoc> = {};
        docs.forEach((d) => {
          map[d.mapping_uuid] = d;
        });
        setUploadedMap(map);
      })
      .catch(() => setError("Failed to load uploaded documents"));
  }, [base, token]);

  const grouped = useMemo(() => {
    const map: Record<string, MappingRow[]> = {};
    rows.forEach((r) => {
      if (!map[r.education_name]) map[r.education_name] = [];
      map[r.education_name].push(r);
    });
    return map;
  }, [rows]);

  const activeRows = activeLevel ? grouped[activeLevel] ?? [] : [];

  const openLevel = (level: string) => {
    setDraft({
    activeLevel: level,
    form: {
      institution_name: "",
      specialization: "",
      year_of_passing: "",
      percentage_cgpa: "",
    },
    filesMeta: {},
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

    const isEmpty = (v: string) => !v || v.trim() === "";
    if (
      isEmpty(form.institution_name) ||
      isEmpty(form.specialization) ||
      isEmpty(form.year_of_passing) ||
      isEmpty(form.percentage_cgpa)
    ) {
      setError("Please fill all common fields");
      return;
    }

    const missingMandatory = activeRows.find(
      (r) =>
        r.is_mandatory &&
        !files[r.mapping_uuid] &&
        !uploadedMap[r.mapping_uuid]
    );

    if (missingMandatory) {
      setError(
        `Please upload required document: ${missingMandatory.document_name}`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      for (const row of activeRows) {
        const file = files[row.mapping_uuid];
        if (!file && !uploadedMap[row.mapping_uuid]) continue;

        const payload = new FormData();
        payload.append("mapping_uuid", row.mapping_uuid);
        payload.append("user_uuid", userUuid);
        payload.append("institution_name", form.institution_name);
        payload.append("specialization", form.specialization);
        payload.append("year_of_passing", form.year_of_passing);
        payload.append("percentage_cgpa", form.percentage_cgpa);
        if (file) payload.append("file", file);


        const url =  `${base}/education/employee-education-document`;

        const res = await fetch(url, {
          method:"POST",
          body: payload,
        });

        if (!res.ok) throw new Error("Save failed");

        const saved: UploadedDoc = await res.json();
        setUploadedMap((prev) => ({
          ...prev,
          [row.mapping_uuid]: saved,
        }));
      }
      
      setDraft((prev) => ({ ...prev, activeLevel: null }));
      setFiles({});
    } catch {
      setError("Failed to save documents");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-8 text-xl font-semibold ">Education Details</h2>

        {Object.entries(grouped).map(([level]) => (
          <div key={level} className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">{level}</h3>
              <button
                onClick={() => openLevel(level)}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white"
              >
                + Add Details
              </button>
            </div>
          </div>
        ))}

        {activeLevel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-6 text-lg font-semibold">
                {activeLevel} – Details
              </h3>

              <div className="mb-6 space-y-3">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Institute Name"
                  value={form.institution_name}
                  onChange={(e) =>
                    setDraft((prev) => ({
                ...prev,
                form: { ...prev.form, institution_name: e.target.value },
              }))
                }
                />
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Specialization"
                  value={form.specialization}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      form: { ...prev.form, specialization: e.target.value },
                    }))
                  }
                />
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Year of Passing"
                  value={form.year_of_passing}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      form: { ...prev.form, year_of_passing: e.target.value },
                    }))
                  }
                />
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Percentage / CGPA"
                  value={form.percentage_cgpa}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      form: { ...prev.form, percentage_cgpa: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="space-y-4">
                {activeRows.map((row) => {
                  const existingFile = files[row.mapping_uuid];

                  return (
                    <div key={row.mapping_uuid}>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {row.document_name}
                        {row.is_mandatory && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </label>

                      <div className="flex items-center gap-3 rounded-md border border-slate-300 px-3 py-2">
                        <label className="cursor-pointer rounded border border-slate-400 bg-white px-3 py-1 text-sm">
                          Choose File
                          <input
                            type="file"
                            hidden
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              if (file) {
                                setFiles((prev) => ({
                                  ...prev,
                                  [row.mapping_uuid]: file,
                                }));

                                setDraft((prev) => ({
                                  ...prev,
                                  filesMeta: {
                                    ...prev.filesMeta,
                                    [row.mapping_uuid]: file.name,
                                  },
                                }));
                              }
                            }}
                          />
                        </label>

                        <span className="text-sm text-slate-600">
                          {existingFile ? existingFile.name : "No file chosen"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDraft((prev) => ({ ...prev, activeLevel: null }))}
                  className="rounded-md bg-slate-200 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          <button
            onClick={() =>
              router.push(`/onboarding/${token}/identity-details`)
            }
            className="rounded-lg bg-slate-200 px-5 py-2 text-sm"
          >
            ← Back
          </button>

          <button
            onClick={() => router.push(`/onboarding/${token}/review`)}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm text-white"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}



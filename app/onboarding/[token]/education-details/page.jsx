"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EducationDetailsPage() {
  const { token } = useParams();
  const router = useRouter();

  const user_uuid = "019b214f-03de-a7a4-b752-5e5c055a87fc";
  const country_uuid = "019a8135-42fc-17ed-4825-f5a4634898fb";

  const [educationLevels, setEducationLevels] = useState([]);
  const [activeLevel, setActiveLevel] = useState(null); // ✅ SINGLE SOURCE
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    institution_name: "",
    specialization: "",
    year_of_passing: "",
    files: {},
  });

  /* ================= FETCH + GROUP ================= */
  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/country-mapping/${country_uuid}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const grouped = data.reduce((acc, row) => {
          if (!acc[row.education_uuid]) {
            acc[row.education_uuid] = {
              education_uuid: row.education_uuid,
              education_name: row.education_name,
              documents: [],
            };
          }

          const exists = acc[row.education_uuid].documents.some(
            (d) => d.document_name === row.document_name
          );

          if (!exists) {
            acc[row.education_uuid].documents.push({
              mapping_uuid: row.mapping_uuid,
              document_name: row.document_name,
              is_mandatory: row.is_mandatory,
            });
          }

          return acc;
        }, {});

        setEducationLevels(Object.values(grouped));
      })
      .catch(() => setError("Failed to load education data"));
  }, []);

  /* ================= OPEN FORM ================= */
  const openForm = (level) => {
    setActiveLevel(level); // ✅ store FULL object
    setForm({
      institution_name: "",
      specialization: "",
      year_of_passing: "",
      files: {},
    });
    setError("");
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!activeLevel?.education_uuid) {
      setError("Education level missing. Reopen the form.");
      return;
    }

    if (
      !form.institution_name ||
      !form.specialization ||
      !form.year_of_passing
    ) {
      setError("Fill all education details");
      return;
    }

    const missingMandatory = activeLevel.documents.some(
      (doc) =>
        doc.is_mandatory && !form.files[doc.mapping_uuid]
    );

    if (missingMandatory) {
      setError("Upload all mandatory documents");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("user_uuid", user_uuid);
      payload.append("education_uuid", activeLevel.education_uuid);
      payload.append("institution_name", form.institution_name);
      payload.append("specialization", form.specialization);
      payload.append("year_of_passing", form.year_of_passing);

      activeLevel.documents.forEach((doc) => {
        payload.append(
          "documents",
          JSON.stringify({ mapping_uuid: doc.mapping_uuid })
        );
        payload.append("files", form.files[doc.mapping_uuid]);
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/employee-education-document`,
        {
          method: "POST",
          body: payload,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      setActiveLevel(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-6xl rounded-xl bg-white p-8 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-800">
          Education Details
        </h2>

        <div className="mt-6 space-y-6">
          {educationLevels.map((level) => (
            <div
              key={level.education_uuid}
              className="rounded-xl border bg-slate-50 p-6"
            >
              <p className="text-lg font-semibold text-slate-800">
                {level.education_name}
              </p>

              <p className="mt-2 text-sm text-slate-600">
                {level.documents.map(d => d.document_name).join(", ")}
              </p>

              <button
                onClick={() => openForm(level)}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Upload Documents
              </button>

              {activeLevel?.education_uuid === level.education_uuid && (
                <div className="mt-6 rounded-lg bg-white p-5 border">
                  <div className="space-y-3">
                    <input
                      placeholder="Institution Name"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      onChange={(e) =>
                        setForm({ ...form, institution_name: e.target.value })
                      }
                    />

                    <input
                      placeholder="Specialization"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      onChange={(e) =>
                        setForm({ ...form, specialization: e.target.value })
                      }
                    />

                    <input
                      type="number"
                      placeholder="Year of Passing"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      onChange={(e) =>
                        setForm({ ...form, year_of_passing: e.target.value })
                      }
                    />

                    {level.documents.map((doc) => (
                      <div key={doc.mapping_uuid}>
                        <label className="text-sm font-medium">
                          {doc.document_name}
                          {doc.is_mandatory && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="file"
                          className="mt-1 text-sm"
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              files: {
                                ...prev.files,
                                [doc.mapping_uuid]: e.target.files[0],
                              },
                            }))
                          }
                        />
                      </div>
                    ))}

                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setActiveLevel(null)}
                      className="rounded-md bg-slate-200 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={loading}
                      onClick={handleSubmit}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
                    >
                      {loading ? "Uploading..." : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

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
            onClick={() =>
              router.push(`/onboarding/${token}/review`)
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

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EducationDetailsPage() {
  const { token } = useParams();
  const router = useRouter();

  const user_uuid = "019b214f-03de-a7a4-b752-5e5c055a87fc";
  const country_uuid = "019a8135-42fc-17ed-4825-f5a4634898fb";

  const [rows, setRows] = useState([]);
  const [uploadedMap, setUploadedMap] = useState({});
  const [error, setError] = useState("");

  /* ---------- MODAL STATE ---------- */
  const [open, setOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    institution_name: "",
    specialization: "",
    year_of_passing: "",
    file: null,
  });

  /* ---------------- FETCH EDUCATION ---------------- */
  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/country-mapping/${country_uuid}`
    )
      .then((res) => res.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load education mapping"));
  }, []);

  /* ---------------- OPEN MODAL ---------------- */
  const openModal = (row) => {
    setActiveRow(row);
    setForm({
      institution_name: "",
      specialization: "",
      year_of_passing: "",
      file: null,
    });
    setError("");
    setOpen(true);
  };

  /* ---------------- UPLOAD ---------------- */
  const handleSubmit = async () => {
    if (
      !form.institution_name ||
      !form.specialization ||
      !form.year_of_passing ||
      !form.file
    ) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("mapping_uuid", activeRow.mapping_uuid);
      payload.append("user_uuid", user_uuid);
      payload.append("institution_name", form.institution_name);
      payload.append("specialization", form.specialization);
      payload.append("year_of_passing", form.year_of_passing);
      payload.append("file", form.file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/employee-education-document`,
        {
          method: "POST",
          body: payload,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      setUploadedMap((prev) => ({
        ...prev,
        [activeRow.mapping_uuid]: {
          fileName: form.file.name,
        },
      }));

      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-xl font-semibold text-slate-800">
          Education Details
        </h2>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-600">
              <th className="p-3">Education Level</th>
              <th className="p-3">Document</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const uploaded = uploadedMap[row.mapping_uuid];

              return (
                <tr
                  key={row.mapping_uuid}
                  className="border-b last:border-none hover:bg-slate-50"
                >
                  <td className="p-3 font-medium text-slate-800">
                    {row.education_name}
                  </td>

                  <td className="p-3">
                    {row.document_name}
                    {row.is_mandatory && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </td>

                  <td className="p-3">
                    {uploaded ? (
                      <div className="inline-flex flex-col rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                        <span>✓ Uploaded</span>
                        <span className="truncate text-[11px]">
                          {uploaded.fileName}
                        </span>
                      </div>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      disabled={uploaded}
                      onClick={() => openModal(row)}
                      className={`rounded-md px-4 py-1.5 text-sm font-medium text-white transition ${
                        uploaded
                          ? "cursor-not-allowed bg-slate-400"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      Upload
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ------------ MODAL ------------ */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">
                Upload – {activeRow.education_name}
              </h3>

              <div className="space-y-3">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Institution Name"
                  onChange={(e) =>
                    setForm({ ...form, institution_name: e.target.value })
                  }
                />

                <input
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Specialization"
                  onChange={(e) =>
                    setForm({ ...form, specialization: e.target.value })
                  }
                />

                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Year of Passing"
                  onChange={(e) =>
                    setForm({ ...form, year_of_passing: e.target.value })
                  }
                />

                <input
                  type="file"
                  className="text-sm"
                  onChange={(e) =>
                    setForm({ ...form, file: e.target.files[0] })
                  }  
                />

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? "Uploading..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() =>
              router.push(`/onboarding/${token}/identity-details`)
            }
            className="rounded-lg bg-slate-200 px-5 py-2 text-sm text-slate-700 hover:bg-slate-300"
          >
            ← Back
          </button>

          <button
            onClick={() => router.push(`/onboarding/${token}/review`)}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

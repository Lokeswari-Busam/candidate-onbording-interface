"use client";

import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useLocalStorageForm } from "../hooks/localStorage";
import { toast } from "react-hot-toast";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";

/* ===================== TYPES (MATCH STORE) ===================== */

interface ExperienceDocument {
  doc_type: string;
 
  file?: File;
  file_path?: string;
}

interface ExperienceDetails {
  experience_uuid?: string;
  company_name: string;
  role_title: string; // ✅ REQUIRED
  start_date: string;
  end_date: string;
  employment_type: string;
  is_current: boolean;
  notice_period_days?: number;
  // remarks: string; // ✅ REQUIRED
  documents: ExperienceDocument[];
}

/* ===================== DOCUMENT RULES ===================== */

const EMPLOYMENT_DOCUMENT_RULES: Record<string, string[]> = {
  "Full-Time": ["exp_certificate_path", "payslip_path"],
  "Part-Time": ["exp_certificate_path"],
  Intern: ["internship_certificate_path"],
  Contract: ["contract_aggrement_path"],
  Freelance: ["exp_certificate_path"],
};

function calculateDuration(start: string, end: string) {
  if (!start || !end) return "";

  const startDate = new Date(start);
  const endDate = new Date(end);

  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0) {
    return `${years} year(s) ${remainingMonths} month(s)`;
  }

  return `${remainingMonths} month(s)`;
}

/* ===================== PAGE ===================== */

export default function ExperienceDetailsPage() {
  const router = useRouter();
  const { token } = useParams();
  const [loading, setLoading] = useState(false);
  const { setLoading: setGlobalLoading } = useGlobalLoading();

  const [mounted, setMounted] = useState(false);
  const [hasExperience, setHasExperience] = useLocalStorageForm<boolean>(
    `has-experience-${token}`,
    false
  );
  
function sanitizeDocuments(
  docs: unknown[]
): ExperienceDocument[] {
  return docs.map((d) => {
    const obj = d as Record<string, unknown>;

    return {
      doc_type: String(obj.doc_type ?? ""),
      file: undefined,
      file_path:
        typeof obj.file_path === "string" ? obj.file_path : undefined,
    };
  });
}
useEffect(() => {
  setExperienceList((prev) =>
    prev.map((exp) => ({
      ...exp,
      documents: sanitizeDocuments(exp.documents ?? []),
    }))
  );

  // run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [experienceList, setExperienceList] = useLocalStorageForm<
    ExperienceDetails[]
  >(`experience-details-${token}`, []);

    useEffect(() => {
      if (hasExperience && experienceList.length === 0) {
        addExperience();
      }
    }, [hasExperience, experienceList]);

  const [originalList, setOriginalList] = useState<ExperienceDetails[] | null>(
    null,
  );

  useEffect(() => {
    if (originalList !== null) return;
    setOriginalList(JSON.parse(JSON.stringify(experienceList)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  const hasExperienceChanged = (
    oldExp: ExperienceDetails,
    newExp: ExperienceDetails,
  ) => {
    return (
      oldExp.company_name !== newExp.company_name ||
      oldExp.role_title !== newExp.role_title ||
      oldExp.start_date !== newExp.start_date ||
      oldExp.end_date !== newExp.end_date ||
      oldExp.employment_type !== newExp.employment_type ||
      oldExp.is_current !== newExp.is_current 
      // oldExp.remarks !== newExp.remarks
    );
  };

  const addExperience = () => {
    const newExp: ExperienceDetails = {
      company_name: "",
      role_title: "", // ✅ NEVER undefined
      start_date: "",
      end_date: "",
      employment_type: "",
      is_current: false,
      notice_period_days: undefined,
      // remarks: "",
      documents: [],
    };

    setExperienceList([...experienceList, newExp]);
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceDetails,
    value: string | number| boolean | ExperienceDocument[],
  ) => {
    const updated = [...experienceList];
    updated[index] = { ...updated[index], [field]: value };
    setExperienceList(updated);
  };

  const updateDocument = (index: number, doc_type: string, file: File) => {
    const updated = [...experienceList];
    const docs = updated[index].documents.filter(
      (d) => d.doc_type !== doc_type,
    );
    //docs.push({ doc_type, file, file_path: typeof file.name === "string" ? file.name : undefined });
    docs.push({ doc_type, file, file_path: file.name, });
    updated[index].documents = docs;
    setExperienceList(updated);
  };

  const validateExperience = () => {

    const allowedTypes = ["pdf","png","jpg","jpeg"]
    const maxSize = 5 * 1024 * 1024

    for (let i = 0; i < experienceList.length; i++) {

      const exp = experienceList[i]

      if (!exp.company_name.trim()) {
        toast.error(`Experience ${i+1}: Company name is required`)
        return false
      }

      if (!exp.role_title.trim()) {
        toast.error(`Experience ${i+1}: Role title is required`)
        return false
      }

      if (!exp.start_date) {
        toast.error(`Experience ${i+1}: Start date is required`)
        return false
      }

      const startDate = new Date(exp.start_date)
      const today = new Date()

      if (startDate > today) {
        toast.error(`Experience ${i+1}: Start date cannot be in future`)
        return false
      }

      if (exp.end_date) {

        const endDate = new Date(exp.end_date)

        if (endDate < startDate) {
          toast.error(`Experience ${i+1}: End date cannot be before start date`)
          return false
        }

      }

      if (exp.is_current && exp.end_date) {
        toast.error(`Experience ${i+1}: Current job cannot have end date`)
        return false
      }

      if (exp.is_current && !exp.notice_period_days) {
        toast.error(`Experience ${i+1}: Notice period is required for current job`)
        return false
      }

      if (exp.notice_period_days && exp.notice_period_days > 120) {
        toast.error(`Experience ${i+1}: Notice period cannot exceed 120 days`)
        return false
      }

      for (const doc of exp.documents) {

        if (doc.file) {

          const extension = doc.file.name.split(".").pop()?.toLowerCase()

          if (!extension || !allowedTypes.includes(extension)) {
            toast.error(`Experience ${i+1}: Invalid file type`)
            return false
          }

          if (doc.file.size > maxSize) {
            toast.error(`Experience ${i+1}: File size cannot exceed 5MB`)
            return false
          }

        }

      }

    }

    return true

  }


  const handleSaveAndContinue = async () => {

    if (!validateExperience()) {
      return
    }

    if (!hasExperience) {
      toast.success("Saved successfully");
      router.push(`/onboarding/${token}/preview-page`);
      return;
    }
    setLoading(true);
    setGlobalLoading(true);

    try {
      if (!token) throw new Error();

      // 1️⃣ Resolve employee_uuid
      const tokenRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`,
      );
      if (!tokenRes.ok) throw new Error();
      const employee_uuid: string = await tokenRes.json();

      // 🔹 Required documents per experience
      for (let i = 0; i < experienceList.length; i++) {
        const exp = experienceList[i];
        const requiredDocs =
          EMPLOYMENT_DOCUMENT_RULES[exp.employment_type] || [];

        for (const docType of requiredDocs) {
          const hasDoc = exp.documents.some((d) => d.doc_type === docType);

          if (!hasDoc) {
            toast.error(
              `Please upload ${docType.replace(/_/g, " ")} for Experience ${i + 1}`,
            );
            setLoading(false);
            return;
          }
        }
      }

      // 3️⃣ NO CHANGES
      const noChanges =
        originalList &&
        originalList.length === experienceList.length &&
        experienceList.every(
          (exp, i) =>
            originalList[i] &&
            !hasExperienceChanged(originalList[i], exp) &&
            JSON.stringify(exp.documents.map(d => d.file_path)) ===
            JSON.stringify(originalList[i].documents.map(d => d.file_path))
,
        );

      if (noChanges) {
        toast.success("No changes detected");
        setLoading(false);
        router.push(`/onboarding/${token}/preview-page`);
        return;
      }

      const resolveFilePath = async (res: Response) => {
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return undefined;
        try {
          const data = (await res.json()) as {
            file_path?: string;
            filePath?: string;
            document_path?: string;
          };
          return (
            data.file_path || data.filePath || data.document_path || undefined
          );
        } catch {
          return undefined;
        }
      };

      // 4️⃣ CREATE / UPDATE
      for (let i = 0; i < experienceList.length; i++) {
        const exp = experienceList[i];
        const old = originalList?.[i];

        // CREATE
        if (!exp.experience_uuid) {
          const form = new FormData();
          form.append("employee_uuid", employee_uuid);
          form.append("company_name", exp.company_name);
          form.append("role_title", exp.role_title);
          form.append("employment_type", exp.employment_type);
          form.append("start_date", exp.start_date);
          if (!exp.end_date) form.append("end_date", exp.end_date);
          form.append("is_current", String(exp.is_current));
         // form.append("remarks", exp.remarks);
          if (exp.notice_period_days) {
            form.append("notice_period_days", String(exp.notice_period_days));
          }

          exp.documents.forEach((d) => {
            form.append("doc_types", d.doc_type);
            if (d.file) form.append("files", d.file);

          });

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/experience/`,
            { method: "POST", body: form },
          );
          if (!res.ok) throw new Error();

          const data = await res.json();
          exp.experience_uuid = data.experience_uuid;
          
          // Update documents with real database file paths from API response
          if (Array.isArray(data?.documents)) {
            // Rebuild documents array from API response to avoid duplicates
            const updatedDocs = data.documents.map(
              (apiDoc: { doc_type?: string; file_path?: string }) => ({
                doc_type: apiDoc.doc_type || "",
                file: undefined,
                file_path: apiDoc.file_path,
              })
            );
            
            setExperienceList((prev) => {
              const updated = [...prev];
              updated[i] = { 
                ...updated[i], 
                experience_uuid: data.experience_uuid, // ✅ Persist the ID!
                documents: updatedDocs 
              };
              return updated;
            });
          } else {
            // If no documents in response, still persist the experience_uuid
            setExperienceList((prev) => {
              const updated = [...prev];
              updated[i] = { 
                ...updated[i], 
                experience_uuid: data.experience_uuid
              };
              return updated;
            });
          }
        }

        // UPDATE metadata and documents together
        else if (old) {
          const hasMetadataChanged = hasExperienceChanged(old, exp);
          const hasNewFiles = exp.documents.some((doc) => doc.file);

          // Only make request if something changed
          if (hasMetadataChanged || hasNewFiles) {
            const form = new FormData();
            
            // Add metadata
            form.append("employee_uuid", employee_uuid);
            form.append("company_name", exp.company_name);
            form.append("role_title", exp.role_title);
            form.append("employment_type", exp.employment_type);
            form.append("start_date", exp.start_date);
            if (exp.end_date) form.append("end_date", exp.end_date);
            form.append("is_current", String(exp.is_current));
          //  form.append("remarks", exp.remarks);

            if (exp.notice_period_days) {
              form.append("notice_period_days", String(exp.notice_period_days));
            }

            // Add new documents
            for (const doc of exp.documents) {
              if (doc.file) {
                form.append("doc_types", doc.doc_type);
                form.append("files", doc.file);
              }
            }

            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/experience/${exp.experience_uuid}`,
              { method: "PUT", body: form },
            );
            if (!res.ok) throw new Error();

            // Update file paths from response if documents were uploaded
            if (hasNewFiles) {
              const data = await res.json();
              if (Array.isArray(data?.documents)) {
                setExperienceList((prev) => {
                  const updated = [...prev];
                  // Rebuild documents array from API response to avoid duplicates
                  const updatedDocs = data.documents.map(
                    (apiDoc: { doc_type?: string; file_path?: string }) => ({
                      doc_type: apiDoc.doc_type || "",
                      file: undefined,
                      file_path: apiDoc.file_path,
                    })
                  );
                  updated[i] = { ...updated[i], documents: updatedDocs };
                  return updated;
                });
              }
            }
          }
        }
      }

      toast.success("Experience details saved");
      router.push(`/onboarding/${token}/preview-page`);
    } catch {
      toast.error("Failed to save experience details");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };
  const removeExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2 style={{ marginBottom: 10}}>Work Experience Details</h2>
          <div style={{ marginBottom: 25 }}>
            <label style={{ fontWeight: 500 }}>
              Do you have prior work experience?
            </label>

            <div style={{ marginTop: 10 }}>
              <label style={{ marginRight: 25, cursor: "pointer" }}>
                <input
                  type="radio"
                  checked={hasExperience === true}
                  onChange={() => setHasExperience(true)}
                />{" "}
                Yes
              </label>

              <label style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  checked={hasExperience === false}
                  onChange={() => setHasExperience(false)}
                />{" "}
                No
              </label>
            </div>
          </div>

        {hasExperience && (
          <div style={{ borderTop: "1px solid #e5e7eb", margin: "25px 0" }} />
        )}

        {hasExperience &&
          experienceList.map((exp, index) => {
            const requiredDocs =
              EMPLOYMENT_DOCUMENT_RULES[exp.employment_type] || [];

          return (
            <div key={index} style={expCard}>
              <h3>Experience {index + 1}</h3>

              <Field label="Company Name *">
                <input
                  value={exp.company_name}
                  onChange={(e) =>
                    updateExperience(index, "company_name", e.target.value)
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="Role / Designation">
                <input
                  value={exp.role_title}
                  onChange={(e) =>
                    updateExperience(index, "role_title", e.target.value)
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="Start Date *">
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={exp.start_date}
                  onChange={(e) =>
                    updateExperience(index, "start_date", e.target.value)
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="End Date">
                <input
                  type="date"
                  disabled={exp.is_current}
                  value={exp.end_date}
                  onChange={(e) =>
                    updateExperience(index, "end_date", e.target.value)
                  }
                  style={inputStyle}
                />
                {exp.start_date && exp.end_date && (
                  <div style={{ marginBottom: 16, fontSize: 14, color: "#374151" }}>
                    Duration: {calculateDuration(exp.start_date, exp.end_date)}
                  </div>
                )}
              </Field>

              <Field label="Employment Type *">
                <select
                  value={exp.employment_type}
                  onChange={(e) =>
                    updateExperience(index, "employment_type", e.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  {Object.keys(EMPLOYMENT_DOCUMENT_RULES)
                    .map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>

              <div style={{ marginBottom: 16 }}>
                <input
                  type="checkbox"
                  checked={exp.is_current}
                  onChange={(e) =>
                    updateExperience(
                      index,
                      "is_current",
                      e.target.checked
                    )
                  }
                />{" "}
                Current Job
              </div>

              {exp.is_current && (
                <Field label="Notice Period (Days)">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={exp.notice_period_days || ""}
                    onChange={(e) =>
                      updateExperience(
                        index,
                        "notice_period_days",
                        Number(e.target.value)
                      )
                    }
                    style={inputStyle}
                  />
                </Field>
              )}

              {/* <Field label="Remarks">
                <textarea
                  rows={3}
                  value={exp.remarks}
                  onChange={(e) =>
                    updateExperience(index, "remarks", e.target.value)
                  }
                  style={inputStyle}
                />
              </Field> */}

              {requiredDocs.map((doc) => (
                <Field key={doc} label={doc.replace(/_/g, " ").toUpperCase()}>
                  <div style={fileOuterBox}>
                    <label style={chooseFileBtn}>
                      Choose File
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        hidden
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          e.target.files &&
                          updateDocument(index, doc, e.target.files[0])
                        }
                      />
                    </label>
                    <span style={fileNameText}>
                      {(() => {
                        const existing = exp.documents.find(
                          (d) => d.doc_type === doc,
                        );
                        if (existing?.file instanceof File) return existing.file.name;
                        if (existing?.file_path) {
                          // Show filename from full path for clarity
                          return existing.file_path.split("/").pop() || existing.file_path;
                        }
                        return "No file chosen";
                      })()}
                    </span>
                  </div>
                </Field>
              ))}

              <button onClick={() => removeExperience(index)} style={removeBtn}>
                Remove Experience
              </button>
            </div>
          );
        })}

        {hasExperience && (
          <button onClick={addExperience} style={addBtn}>
            + Add Experience
          </button>
        )}

        <div style={{ textAlign: "right", marginTop: 24 }}>
          <button
            type="submit"
            style={{
              ...submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
            onClick={handleSaveAndContinue}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </button>

          {/* <button type="submit" style={submitBtn} disabled={loading} onClick={handleSaveAndContinue}>
              Save & Continue
            </button> */}
        </div>
      </div>
    </div>
  );
}

/* ===================== FIELD ===================== */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 6 }}>{label}</label>
      {children}
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

const expCard = {
  border: "1px solid #d1d5db",
  padding: 20,
  borderRadius: 8,
  marginBottom: 20,
};

const inputStyle = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  border: "1px solid #000",
  borderRadius: 4,
};

const addBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "8px 16px",
  border: "none",
};

const removeBtn = {
  background: "#ef4444",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
};

const submitBtn = {
  backgroundColor: "#2563eb",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: 6,
  border: "none",
};

const fileOuterBox = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: 40,
  border: "1px solid #000", // main input border
  borderRadius: 4,
  padding: "0 8px",
  backgroundColor: "#fff",
};

const fileButton = {
  border: "1px solid #9ca3af", // separate button border
  padding: "4px 10px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
  backgroundColor: "#fff",
  whiteSpace: "nowrap",
};

const fileNameText = {
  marginLeft: 12,
  fontSize: 14,

  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const chooseFileBtn = {
  ...fileButton,
  color: "black",
};

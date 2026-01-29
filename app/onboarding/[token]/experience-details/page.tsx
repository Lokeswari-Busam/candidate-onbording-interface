"use client";

import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { useLocalStorageForm } from "../hooks/localStorage";

/* ===================== TYPES (MATCH STORE) ===================== */

interface ExperienceDocument {
  doc_type: string;
  file: File;
}

interface ExperienceDetails {
  company_name: string;
  role_title: string;        // ✅ REQUIRED
  start_date: string;
  end_date: string;
  employment_type: string;
  is_current: number;
  remarks: string;           // ✅ REQUIRED
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

/* ===================== PAGE ===================== */

export default function ExperienceDetailsPage() {
  const router = useRouter();
  const { token } = useParams();
  const [loading, setLoading] = useState(false);

  const [experienceList, setExperienceList] =
  useLocalStorageForm<ExperienceDetails[]>(
    `experience-details-${token}`,
    []
  );
    
  const addExperience = () => {
    const newExp: ExperienceDetails = {
      company_name: "",
      role_title: "",      // ✅ NEVER undefined
      start_date: "",
      end_date: "",
      employment_type: "",
      is_current: 0,
      remarks: "",
      documents: [],
    };

    setExperienceList([...experienceList, newExp]);
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceDetails,
    value: string | number | ExperienceDocument[]
  ) => {
    const updated = [...experienceList];
    updated[index] = { ...updated[index], [field]: value };
    setExperienceList(updated);
  };

  const updateDocument = (
    index: number,
    doc_type: string,
    file: File
  ) => {
    const updated = [...experienceList];
    const docs = updated[index].documents.filter(
      (d) => d.doc_type !== doc_type
    );
    docs.push({ doc_type, file });
    updated[index].documents = docs;
    setExperienceList(updated);
  };

  const handleSaveAndContinue = () => {
  if (experienceList.length === 0) {
    alert("Please add at least one experience.");
    return;
  }

  for (let i = 0; i < experienceList.length; i++) {
    const exp = experienceList[i];

    if (
      !exp.company_name ||
      !exp.role_title ||
      !exp.start_date ||
      !exp.employment_type ||
      !exp.remarks
    ) {
      alert(`Please fill all required fields in Experience ${i + 1}`);
      return;
    }

    if (exp.is_current === 0 && !exp.end_date) {
      alert(`Please provide End Date in Experience ${i + 1}`);
      return;
    }

    const requiredDocs =
      EMPLOYMENT_DOCUMENT_RULES[exp.employment_type] || [];

    for (const doc of requiredDocs) {
      const hasDoc = exp.documents.some((d) => d.doc_type === doc);
      if (!hasDoc) {
        alert(
          `Please upload ${doc.replace(/_/g, " ")} in Experience ${i + 1}`
        );
        return;
      }
    }
  }

  // All validations passed
  setLoading(true);
  router.push(`/onboarding/${token}/preview-page`);
};


  const removeExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2>Work Experience Details</h2>

        {experienceList.map((exp, index) => {
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
                  disabled={exp.is_current === 1}
                  value={exp.end_date}
                  onChange={(e) =>
                    updateExperience(index, "end_date", e.target.value)
                  }
                  style={inputStyle}
                />
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
                  {Object.keys(EMPLOYMENT_DOCUMENT_RULES).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>

              <div style={{ marginBottom: 16 }}>
                <input
                  type="checkbox"
                  checked={exp.is_current === 1}
                  onChange={(e) =>
                    updateExperience(
                      index,
                      "is_current",
                      e.target.checked ? 1 : 0
                    )
                  }
                />{" "}
                Current Job
              </div>

              <Field label="Remarks">
                <textarea
                  rows={3}
                  value={exp.remarks}
                  onChange={(e) =>
                    updateExperience(index, "remarks", e.target.value)
                  }
                  style={inputStyle}
                />
              </Field>

              {requiredDocs.map((doc) => (
                <Field key={doc} label={doc.replace(/_/g, " ").toUpperCase()}>
                  <div style={fileOuterBox}>
                    <label style={chooseFileBtn}>
                      Choose File
                  <input
                    type="file" hidden
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      e.target.files &&
                      updateDocument(index, doc, e.target.files[0])
                    }
                  />
                    </label>
                    <span style={fileNameText}>
                      {exp.documents.find((d) => d.doc_type === doc)?.file.name ||
                        "No file chosen"}
                    </span>
                    </div>
                </Field>
              ))}

              <button
                onClick={() => removeExperience(index)}
                style={removeBtn}
              >
                Remove Experience
              </button>
            </div>
          );
        })}

        <button onClick={addExperience} style={addBtn}>
          + Add Experience
        </button>

        <div style={{ textAlign: "right", marginTop: 24 }}>
            <button type="submit" style={submitBtn} disabled={loading} onClick={handleSaveAndContinue}>
              Save & Continue
            </button>
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
      <label style={{ display: "block", marginBottom: 6 }}>
        {label}
      </label>
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
  border: "1px solid #000",       // main input border
  borderRadius: 4,
  padding: "0 8px",
  backgroundColor: "#fff",
};

const fileButton = {
  border: "1px solid #9ca3af",    // separate button border
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



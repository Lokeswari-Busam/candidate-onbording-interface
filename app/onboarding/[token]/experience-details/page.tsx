"use client";

import { useParams, useRouter } from "next/navigation";
import { ChangeEvent } from "react";
import { useOnboardingStore } from "@/app/store/useOnboardingStore";

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

  const { experience, setExperience } = useOnboardingStore();

  const experienceList = experience as ExperienceDetails[];

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

    setExperience([...experienceList, newExp]);
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceDetails,
    value: string | number | ExperienceDocument[]
  ) => {
    const updated = [...experienceList];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
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
    setExperience(updated);
  };

  const removeExperience = (index: number) => {
    setExperience(experienceList.filter((_, i) => i !== index));
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

        <div style={footer}>
          <button
            onClick={() =>
              router.push(`/onboarding/${token}/identity-details`)
            }
            style={backBtn}
          >
            ← Back
          </button>

          <button
            onClick={() =>
              router.push(`/onboarding/${token}/success`)
            }
            style={submitBtn}
          >
            Continue
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
  background: "#16a34a",
  color: "#fff",
  padding: "8px 16px",
  border: "none",
};

const backBtn = {
  background: "#e5e7eb",
  padding: "8px 16px",
  border: "1px solid #9ca3af",
};

const footer = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 24,
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


// "use client";

// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";

// export default function ExperienceDetailsPage() {
//   const { token } = useParams();
//   const router = useRouter();

//   // 🔹 MOCKED user_uuid from onboarding link
//   const user_uuid = "019b214f-03de-a7a4-b752-5e5c055a87fc";

//   /* ---------------- STATE ---------------- */
//   const [form, setForm] = useState({
//     company_name: "",
//     role_title: "",
//     start_date: "",
//     end_date: "",
//     employment_type: "",
//     is_current: 0,
//     remarks: "",
//   });

//   const [file, setFile] = useState(null);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   /* ---------------- HANDLERS ---------------- */
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm({ ...form, [name]: value });
//   };

//   const handleCurrent = (e) => {
//     const checked = e.target.checked;
//     setForm({
//       ...form,
//       is_current: checked ? 1 : 0,
//       end_date: checked ? "" : form.end_date,
//     });
//   };

//   /* ---------------- SAVE EXPERIENCE ---------------- */
//   const handleSave = async () => {
//     if (!form.company_name || !form.start_date || !form.employment_type || !file) {
//       setError("Please fill all required fields");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("employee_uuid", user_uuid);

//     Object.entries(form).forEach(([k, v]) => {
//       formData.append(k, v ?? "");
//     });

//     formData.append("file", file);

//     try {
//       setLoading(true);
//       setError("");

//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_BASE_URL}/experience/`,
//         {
//           method: "POST",
//           body: formData,
//         }
//       );

//       if (!res.ok) throw new Error();

//       alert("Experience saved successfully");
//     } catch {
//       setError("Failed to save experience");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ---------------- CONTINUE ---------------- */
//   const handleContinue = () => {
//     router.push(`/onboarding/${token}/success`);
//   };

//   return (
//     <div style={pageWrapper}>
//       <div style={cardStyle}>
//         <h2 style={titleStyle}>Work Experience Details</h2>

//         <Field label="Company Name *">
//           <input
//             name="company_name"
//             value={form.company_name}
//             onChange={handleChange}
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="Role / Designation">
//           <input
//             name="role_title"
//             value={form.role_title}
//             onChange={handleChange}
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="Start Date *">
//           <input
//             type="date"
//             name="start_date"
//             value={form.start_date}
//             onChange={handleChange}
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="End Date">
//           <input
//             type="date"
//             name="end_date"
//             value={form.end_date}
//             disabled={form.is_current === 1}
//             onChange={handleChange}
//             style={{
//               ...inputStyle,
//               background: form.is_current ? "#f3f4f6" : "#fff",
//             }}
//           />
//         </Field>

//         <Field label="Employment Type *">
//           <select
//             name="employment_type"
//             value={form.employment_type}
//             onChange={handleChange}
//             style={inputStyle}
//           >
//             <option value="">Select</option>
//             <option value="Full-Time">Full-Time</option>
//             <option value="Part-Time">Part-Time</option>
//             <option value="Intern">Intern</option>
//             <option value="Contract">Contract</option>
//             <option value="Freelance">Freelance</option>
//           </select>
//         </Field>

//         <div style={{ marginBottom: 16 }}>
//           <input
//             type="checkbox"
//             checked={form.is_current === 1}
//             onChange={handleCurrent}
//           />{" "}
//           <label> This is my current job</label>
//         </div>

//         <Field label="Remarks">
//           <textarea
//             rows={3}
//             name="remarks"
//             value={form.remarks}
//             onChange={handleChange}
//             style={{ ...inputStyle, height: "auto" }}
//           />
//         </Field>

//         <Field label="Upload Experience Certificate *">
//           <div style={fileBox}>
//             <label style={chooseFileBtn}>
//               Choose File
//               <input
//                 type="file"
//                 hidden
//                 onChange={(e) => setFile(e.target.files[0])}
//               />
//             </label>
//             <span style={{ marginLeft: 12 }}>
//               {file?.name || "No file chosen"}
//             </span>
//           </div>
//         </Field>

//         {error && <div style={{ color: "red" }}>{error}</div>}

//         {/* Footer */}
//         <div style={footer}>
//           <button
//             onClick={() =>
//               router.push(`/onboarding/${token}/identity-details`)
//             }
//             style={backBtn}
//           >
//             ← Back
//           </button>

//           <div>
//             <button
//               onClick={handleSave}
//               disabled={loading}
//               style={{ ...submitBtn, marginRight: 8 }}
//             >
//               {loading ? "Saving..." : "Save"}
//             </button>

//             <button onClick={handleContinue} style={submitBtn}>
//               Continue
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------------- STYLES ---------------- */
// const pageWrapper = {
//   padding: "32px 0",
//   background: "#f5f7fb",
//   minHeight: "100vh",
// };

// const cardStyle = {
//   maxWidth: 600,
//   margin: "auto",
//   background: "#fff",
//   padding: 24,
//   borderRadius: 8,
// };

// const titleStyle = {
//   fontSize: 20,
//   fontWeight: 600,
//   marginBottom: 24,
// };

// const inputStyle = {
//   width: "100%",
//   height: 40,
//   padding: "0 12px",
//    border: "1px solid #000",   // 🔴 IMPORTANT
//   borderRadius: 4,
//   backgroundColor: "#fff",
//   outline: "none",
// };

// const fileBox = {
//   display: "flex",
//   alignItems: "center",
//   border: "1px solid #d1d5db",
//   padding: 8,
// };

// const chooseFileBtn = {
//   border: "1px solid #9ca3af",
//   padding: "4px 10px",
//   cursor: "pointer",
// };

// const submitBtn = {
//   background: "#2563eb",
//   color: "#fff",
//   padding: "8px 16px",
//   border: "none",
// };

// const footer = {
//   display: "flex",
//   justifyContent: "space-between",
//   marginTop: 24,
// };

// const backBtn = {
//   background: "#e5e7eb",
//   color: "#000",
//   padding: "8px 16px",
//   border: "1px solid #9ca3af",
//   borderRadius: 4,
//   backgroundColor: "#fff",
//   outline: "none",
  
// };

// function Field({ label, children }) {
//   return (
//     <div style={{ marginBottom: 16 }}>
//       <label style={{ display: "block", marginBottom: 6 }}>{label}</label>
//       {children}
//     </div>
//   );
// }


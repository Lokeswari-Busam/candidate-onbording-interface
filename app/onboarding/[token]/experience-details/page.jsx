"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ExperienceDetailsPage() {
  const { token } = useParams();
  const router = useRouter();

  // 🔹 MOCKED user_uuid from onboarding link
  const user_uuid = "019b214f-03de-a7a4-b752-5e5c055a87fc";

  /* ---------------- STATE ---------------- */
  const [form, setForm] = useState({
    company_name: "",
    role_title: "",
    start_date: "",
    end_date: "",
    employment_type: "",
    is_current: 0,
    remarks: "",
  });

  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCurrent = (e) => {
    const checked = e.target.checked;
    setForm({
      ...form,
      is_current: checked ? 1 : 0,
      end_date: checked ? "" : form.end_date,
    });
  };

  /* ---------------- SAVE EXPERIENCE ---------------- */
  const handleSave = async () => {
    if (!form.company_name || !form.start_date || !form.employment_type || !file) {
      setError("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("employee_uuid", user_uuid);

    Object.entries(form).forEach(([k, v]) => {
      formData.append(k, v ?? "");
    });

    formData.append("file", file);

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/experience/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error();

      alert("Experience saved successfully");
    } catch {
      setError("Failed to save experience");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CONTINUE ---------------- */
  const handleContinue = () => {
    router.push(`/onboarding/${token}/next-step`);
  };

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Work Experience Details</h2>

        <Field label="Company Name *">
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            style={inputStyle}
          />
        </Field>

        <Field label="Role / Designation">
          <input
            name="role_title"
            value={form.role_title}
            onChange={handleChange}
            style={inputStyle}
          />
        </Field>

        <Field label="Start Date *">
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            style={inputStyle}
          />
        </Field>

        <Field label="End Date">
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            disabled={form.is_current === 1}
            onChange={handleChange}
            style={{
              ...inputStyle,
              background: form.is_current ? "#f3f4f6" : "#fff",
            }}
          />
        </Field>

        <Field label="Employment Type *">
          <select
            name="employment_type"
            value={form.employment_type}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Intern">Intern</option>
            <option value="Contract">Contract</option>
            <option value="Freelance">Freelance</option>
          </select>
        </Field>

        <div style={{ marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={form.is_current === 1}
            onChange={handleCurrent}
          />{" "}
          <label> This is my current job</label>
        </div>

        <Field label="Remarks">
          <textarea
            rows={3}
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            style={{ ...inputStyle, height: "auto" }}
          />
        </Field>

        <Field label="Upload Experience Certificate *">
          <div style={fileBox}>
            <label style={chooseFileBtn}>
              Choose File
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
            <span style={{ marginLeft: 12 }}>
              {file?.name || "No file chosen"}
            </span>
          </div>
        </Field>

        {error && <div style={{ color: "red" }}>{error}</div>}

        {/* Footer */}
        <div style={footer}>
          <button
            onClick={() =>
              router.push(`/onboarding/${token}/identity-details`)
            }
            style={backBtn}
          >
            ← Back
          </button>

          <div>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{ ...submitBtn, marginRight: 8 }}
            >
              {loading ? "Saving..." : "Save"}
            </button>

            <button onClick={handleContinue} style={submitBtn}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const pageWrapper = {
  padding: "32px 0",
  background: "#f5f7fb",
  minHeight: "100vh",
};

const cardStyle = {
  maxWidth: 600,
  margin: "auto",
  background: "#fff",
  padding: 24,
  borderRadius: 8,
};

const titleStyle = {
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 24,
};

const inputStyle = {
  width: "100%",
  height: 40,
  padding: "0 12px",
   border: "1px solid #000",   // 🔴 IMPORTANT
  borderRadius: 4,
  backgroundColor: "#fff",
  outline: "none",
};

const fileBox = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #d1d5db",
  padding: 8,
};

const chooseFileBtn = {
  border: "1px solid #9ca3af",
  padding: "4px 10px",
  cursor: "pointer",
};

const submitBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "8px 16px",
  border: "none",
};

const footer = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 24,
};

const backBtn = {
  background: "#e5e7eb",
  color: "#000",
  padding: "8px 16px",
  border: "1px solid #9ca3af",
  borderRadius: 4,
  backgroundColor: "#fff",
  outline: "none",
  
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}


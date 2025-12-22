"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function IdentityDocumentsPage() {
  const { token } = useParams();
  const router = useRouter();

  const user_uuid = "019b214f-03de-a7a4-b752-5e5c055a87fc";

  /* ---------------- STATE ---------------- */
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  const [identityTypes, setIdentityTypes] = useState([]); // dropdown
  const [countryMappings, setCountryMappings] = useState([]); // mapping_uuid resolver

  const [selectedIdentity, setSelectedIdentity] = useState("");
  const [uploads, setUploads] = useState({});
  const [error, setError] = useState("");

  /* ---------------- FETCH COUNTRIES ---------------- */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data) => {
        setCountries((Array.isArray(data) ? data : []).filter(c => c.is_active));
      })
      .catch(() => setError("Unable to load countries"));
  }, []);

  /* ---------------- FETCH IDENTITY TYPES ---------------- */
  useEffect(() => {
    if (!selectedCountry) return;

    Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/identity/country-mapping/identities/${selectedCountry}`
      ).then(res => res.json()),

      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/identity/country-mapping/`
      ).then(res => res.json())
    ])
      .then(([identities, mappings]) => {
        setIdentityTypes(Array.isArray(identities) ? identities : []);
        setCountryMappings(Array.isArray(mappings) ? mappings : []);
        setError("");
      })
      .catch(() => setError("Unable to load identity requirements"));
  }, [selectedCountry]);

  /* ---------------- FILE HANDLING ---------------- */
  const handleFileChange = (file) => {
    setUploads({ file });
  };

//    const handleFileChange = (identityTypeUuid, file) => {
//     setUploads((prev) => ({
//       ...prev,
//       [identityTypeUuid]: file,
//     }));
//   };

  /* ---------------- SAVE (UPLOAD API) ---------------- */
  const handleSave = async () => {
    if (!selectedIdentity || !uploads.file) {
      setError("Please select identity and upload file");
      return;
    }

    // 🔑 FIND CORRECT mapping_uuid
    const mapping = countryMappings.find(
      (m) =>
        m.country_uuid === selectedCountry &&
        m.identity_type_uuid === selectedIdentity
    );
    //  const mapping = mappings.find(
    //     (m) => m.identity_type_uuid === doc.identity_type_uuid
    //   );

    if (!mapping) {
      setError("Mapping Not Found");
      return;
    }

    const formData = new FormData();
    formData.append("mapping_uuid", mapping.mapping_uuid);
    formData.append("user_uuid", user_uuid);
    formData.append("file", uploads.file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-details/identity`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      alert("Identity saved successfully");
    } catch {
      setError("Internal server error while uploading");
    }
  };

  /* ---------------- CONTINUE ---------------- */
  const handleContinue = () => {
    router.push(`/onboarding/${token}/education-details`);
  };

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Identity Details</h2>

        <Field label="Country *">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.country_uuid} value={c.country_uuid}>
                {c.country_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Identity Type *">
          <select
            value={selectedIdentity}
            onChange={(e) => setSelectedIdentity(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select Identity</option>
            {identityTypes.map((i) => (
              <option key={i.identity_type_uuid} value={i.identity_type_uuid}>
                {i.identity_type_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Upload Document *">
          <div style={fileBox}>
            <label style={chooseFileBtn}>
              Choose File
              <input
                type="file"
                hidden
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
            </label>
            <span style={{ marginLeft: 12 }}>
              {uploads.file?.name || "No file chosen"}
            </span>
          </div>
        </Field>

        {error && <div style={{ color: "red" }}>{error}</div>}

         <div style={footer}>
          <button
            type="button"
            onClick={() =>
              router.push(`/onboarding/${token}/address-details`)
            }
            style={backBtn}
          >
            ← Back
          </button>

          <div>
            <button onClick={handleSave} style={{ ...submitBtn, marginRight: 8 }}>
              Save
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
const pageWrapper = { padding: "32px 0", background: "#f5f7fb", minHeight: "100vh" };
const cardStyle = { maxWidth: 600, margin: "auto", background: "#fff", padding: 24, borderRadius: 8 };
const titleStyle = { fontSize: 20, fontWeight: 600, marginBottom: 24 };
const inputStyle = { width: "100%", height: 40, padding: "0 12px" };
const fileBox = { display: "flex", alignItems: "center", border: "1px solid #d1d5db", padding: 8 };
const chooseFileBtn = { border: "1px solid #9ca3af", padding: "4px 10px", cursor: "pointer" };
const submitBtn = { background: "#2563eb", color: "#fff", padding: "8px 16px", border: "none" };
const footer = { display: "flex", justifyContent: "space-between", marginTop: 24 };
const backBtn = { background: "#e5e7eb", color: "#000", padding: "8px 16px", border: "none" };


function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

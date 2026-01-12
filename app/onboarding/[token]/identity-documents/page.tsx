"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOnboardingStore } from "@/app/store/useOnboardingStore";
import type { IdentityDocument } from "@/app/store/useOnboardingStore";

/* ===================== TYPES ===================== */

interface Country {
  country_uuid: string;
  country_name: string;
  is_active: boolean;
}

interface IdentityType {
  identity_type_uuid: string;
  identity_type_name: string;
  is_mandatory: boolean;
}

/* ===================== COMPONENT ===================== */

export default function IdentityDocumentsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const { identity, setIdentity } = useOnboardingStore();

  const [countries, setCountries] = useState<Country[]>([]);
  const [identityTypes, setIdentityTypes] = useState<IdentityType[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    identity?.country_uuid ?? ""
  );

  const [documents, setDocuments] = useState<IdentityDocument[]>(
    identity?.documents ?? []
  );

  const [error, setError] = useState("");

  /* ===================== FETCH COUNTRIES ===================== */

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) =>
        setCountries((Array.isArray(data) ? data : []).filter((c) => c.is_active))
      )
      .catch(() => setError("Unable to load countries"));
  }, []);

  /* ===================== FETCH IDENTITY TYPES ===================== */

  useEffect(() => {
    if (!selectedCountry) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/identity/country-mapping/identities/${selectedCountry}`
    )
      .then((res) => res.json())
      .then((data: IdentityType[]) => {
        const list = Array.isArray(data) ? data : [];
        const mandatory = list.filter((d) => d.is_mandatory);

        if (mandatory.length < 2) {
          setError(
            "This country must have at least 2 mandatory identity documents. Please contact HR."
          );
        } else {
          setError("");
        }

        setIdentityTypes(list);
      })
      .catch(() => setError("Unable to load identity documents"));
  }, [selectedCountry]);

  /* ===================== FILE HANDLING ===================== */

  const handleFileChange = (
    identityType: IdentityType,
    file?: File
  ) => {
    if (!file) return;

    setDocuments((prev) => {
      const existing = prev.find(
        (d) => d.identity_type_uuid === identityType.identity_type_uuid
      );

      if (existing) {
        return prev.map((d) =>
          d.identity_type_uuid === identityType.identity_type_uuid
            ? { ...d, file }
            : d
        );
      }

      return [
        ...prev,
        {
          identity_type_uuid: identityType.identity_type_uuid,
          identity_type_name: identityType.identity_type_name,
          file,
          identity_file_number: "",
        },
      ];
    });
  };

  /* ===================== IDENTITY NUMBER HANDLING (NEW) ===================== */

  const handleIdentityNumberChange = (
    identityType: IdentityType,
    value: string
  ) => {
    setDocuments((prev) => {
      const existing = prev.find(
        (d) => d.identity_type_uuid === identityType.identity_type_uuid
      );

      if (existing) {
        return prev.map((d) =>
          d.identity_type_uuid === identityType.identity_type_uuid
            ? { ...d, identity_file_number: value }
            : d
        );
      }

      return [
        ...prev,
        {
          identity_type_uuid: identityType.identity_type_uuid,
          identity_type_name: identityType.identity_type_name,
          identity_file_number: value,
          file: undefined as unknown as File,
        },
      ];
    });
  };

  /* ===================== CONTINUE ===================== */

  const handleContinue = () => {
    const mandatoryDocs = identityTypes.filter((d) => d.is_mandatory);

    if (mandatoryDocs.length < 2) {
      setError("Minimum 2 mandatory identity documents are required.");
      return;
    }

    const uploadedMandatory = mandatoryDocs.every((doc) =>
      documents.some(
        (d) => d.identity_type_uuid === doc.identity_type_uuid
      )
    );

    if (!uploadedMandatory) {
      setError("Please upload all mandatory identity documents.");
      return;
    }

    setIdentity({
      country_uuid: selectedCountry,
      documents,
    });

    router.push(`/onboarding/${token}/education-details`);
  };

  /* ===================== UI ===================== */

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Identity Details</h2>

        <Field label="Country *">
          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setDocuments([]);
            }}
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

        {identityTypes
          .filter((doc) => doc.is_mandatory)
          .map((doc) => (
            <Field
              key={doc.identity_type_uuid}
              label={`${doc.identity_type_name} *`}
            >
              {/* 🔹 Identity File Number */}
              <input
                type="text"
                placeholder={`${doc.identity_type_name} Number`}
                value={
                  documents.find(
                    (d) => d.identity_type_uuid === doc.identity_type_uuid
                  )?.identity_file_number || ""
                }
                onChange={(e) =>
                  handleIdentityNumberChange(doc, e.target.value)
                }
                style={{ ...inputStyle, marginBottom: 8 }}
              />

              {/* 🔹 File Upload */}
              <div style={fileOuterBox}>
                <label style={chooseFileBtn}>
                  Choose File
                  <input
                    type="file"
                    hidden
                    onChange={(e) =>
                      handleFileChange(doc, e.target.files?.[0])
                    }
                  />
                </label>
                <span style={fileNameText}>
                  {documents.find(
                    (d) => d.identity_type_uuid === doc.identity_type_uuid
                  )?.file?.name || "No file chosen"}
                </span>
              </div>

              {documents.some(
                (d) => d.identity_type_uuid === doc.identity_type_uuid
              ) && (
                <div style={{ fontSize: 12, color: "green", marginTop: 4 }}>
                  ✓ Uploaded
                </div>
              )}
            </Field>
          ))}

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

          <button onClick={handleContinue} style={submitBtn}>
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
      <label style={labelStyle}>{label}</label>
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

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 500,
};

const inputStyle = {
  width: "100%",
  height: 44,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  padding: "0 12px",
};

const footer = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 24,
};

const submitBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: 6,
  border: "none",
};

const backBtn = {
  background: "#e5e7eb",
  color: "#000",
  padding: "10px 20px",
  borderRadius: 6,
  border: "none",
};

const fileOuterBox = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: 40,
  border: "1px solid #000",
  borderRadius: 4,
  padding: "0 8px",
  backgroundColor: "#fff",
};

const chooseFileBtn = {
  border: "1px solid #9ca3af",
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
  color: "#374151",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

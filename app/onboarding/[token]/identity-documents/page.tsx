"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorageForm } from "../hooks/localStorage";
import toast from "react-hot-toast";

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

interface IdentityDocument {
  identity_type_uuid: string;
  identity_type_name: string;
  identity_file_number: string;
  fileName?: string;
}


interface IdentityDraft {
  country_uuid: string;
  documents: (IdentityDocument & { file?: File })[];
}


/* ===================== COMPONENT ===================== */

export default function IdentityDocumentsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();


  const [countries, setCountries] = useState<Country[]>([]);
  const [identityTypes, setIdentityTypes] = useState<IdentityType[]>([]);
  const [draft, setDraft] = useLocalStorageForm<IdentityDraft>(
  `identity-details-${token}`,
  {
    country_uuid: "",
    documents: [],
  }
  );
  const selectedCountry = draft.country_uuid;
  const documents = draft.documents;
  type ExistingDoc = {
  identity_uuid: string;
  identity_type_uuid: string;
  identity_file_number: string;
};

  const [originalDocs, setOriginalDocs] = useState<
    Record<string, ExistingDoc>
  >({});
  

  const [error, setError] = useState("");

  function isDocEqual(
  a: IdentityDocument & { file?: File },
  b: ExistingDoc
) {
  return a.identity_file_number === b.identity_file_number && !a.file;
}


  /* ===================== FETCH COUNTRIES ===================== */

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) =>
        setCountries(
          (Array.isArray(data) ? data : []).filter((c) => c.is_active),
        ),
      )
      .catch(() => setError("Unable to load countries"));
  }, []);

  /* ===================== FETCH IDENTITY TYPES ===================== */

  useEffect(() => {
    if (!selectedCountry) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/identity/country-mapping/identities/${selectedCountry}`,
    )
      .then((res) => res.json())
      .then((data: IdentityType[]) => {
        const list = Array.isArray(data) ? data : [];
        const mandatory = list.filter((d) => d.is_mandatory);

        if (mandatory.length < 2) {
          setError(
            "This country must have at least 2 mandatory identity documents. Please contact HR.",
          );
        } else {
          setError("");
        }

        setIdentityTypes(list);
      })
      .catch(() => setError("Unable to load identity documents"));
  }, [selectedCountry]);

  useEffect(() => {
  if (!token) return;

  (async () => {
    try {
      // Resolve user_uuid
      const tokenRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
      );
      if (!tokenRes.ok) throw new Error();
      const user_uuid: string = await tokenRes.json();

      // Fetch existing identity docs for this user
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/identity-documents/${user_uuid}`
      );
      if (!res.ok) throw new Error();

      const data: ExistingDoc[] = await res.json();

      // Normalize into lookup map
      const map: Record<string, ExistingDoc> = {};
      data.forEach((d) => {
        map[d.identity_type_uuid] = d;
      });

      setOriginalDocs(map);

      // Optional: prefill numbers into draft
      setDraft((prev) => ({
        ...prev,
        documents: data.map((d) => ({
          identity_type_uuid: d.identity_type_uuid,
          identity_type_name: "",
          identity_file_number: d.identity_file_number,
        })),
      }));
    } catch {
      // First-time user – no existing data
    }
  })();
}, [token, setDraft]);

  /* ===================== FILE HANDLING ===================== */

  
    const handleFileChange = (identityType: IdentityType, file?: File) => {
  if (!file) return;

  setDraft((prev) => {
    const existing = prev.documents.find(
      (d) => d.identity_type_uuid === identityType.identity_type_uuid
    );

    const updatedDocs = existing
      ? prev.documents.map((d) =>
          d.identity_type_uuid === identityType.identity_type_uuid
            ? { ...d, file }
            : d
        )
      : [
          ...prev.documents,
          {
            identity_type_uuid: identityType.identity_type_uuid,
            identity_type_name: identityType.identity_type_name,
            identity_file_number: "",
            file,
          },
        ];

    return { ...prev, documents: updatedDocs };
  });
};


  /* ===================== IDENTITY NUMBER HANDLING (NEW) ===================== */

  const handleIdentityNumberChange = (
  identityType: IdentityType,
  value: string
) => {
  setDraft((prev) => {
    const existing = prev.documents.find(
      (d) => d.identity_type_uuid === identityType.identity_type_uuid
    );

    const updatedDocs = existing
      ? prev.documents.map((d) =>
          d.identity_type_uuid === identityType.identity_type_uuid
            ? { ...d, identity_file_number: value }
            : d
        )
      : [
          ...prev.documents,
          {
            identity_type_uuid: identityType.identity_type_uuid,
            identity_type_name: identityType.identity_type_name,
            identity_file_number: value,
            file: undefined as unknown as File,
          },
        ];

    return { ...prev, documents: updatedDocs };
  });
};

      

  /* ===================== CONTINUE ===================== */

//   const handleContinue = () => {
//   const mandatoryDocs = identityTypes.filter((d) => d.is_mandatory);

//   const uploadedMandatory = mandatoryDocs.every((doc) =>
//     documents.some(
//       (d) =>
//         d.identity_type_uuid === doc.identity_type_uuid &&
//         d.identity_file_number?.trim() &&
//         d.file
//     )
//   );
//   if (!uploadedMandatory) {
//     setError("Please upload all mandatory identity documents.");
//     return;
//   }
//   // later: POST draft to backend here
//   // 🔥 clears localStorage only after success
//   router.push(`/onboarding/${token}/education-details`);
// };

  const handleContinue = async () => {
  const mandatoryDocs = identityTypes.filter((d) => d.is_mandatory);

  // Basic draft validation (numbers only)
  const numbersOk = mandatoryDocs.every((doc) =>
    documents.some(
      (d) =>
        d.identity_type_uuid === doc.identity_type_uuid &&
        d.identity_file_number?.trim()
    )
  );

  if (!numbersOk) {
    setError("Please fill all mandatory identity numbers.");
    return;
  }

  try {
    const tokenRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
    );
    if (!tokenRes.ok) throw new Error();
    const user_uuid: string = await tokenRes.json();

    for (const doc of documents) {
      const existing = originalDocs[doc.identity_type_uuid];

      const form = new FormData();
      form.append("mapping_uuid", doc.identity_type_uuid);
      form.append("user_uuid", user_uuid);
      form.append("identity_file_number", doc.identity_file_number);
      if (doc.file) form.append("file", doc.file);

      // 1️⃣ CREATE
      if (!existing) {
        if (!doc.file) {
          setError(`Please upload ${doc.identity_type_name}`);
          return;
        }

        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/identity-documents`,
          { method: "POST", body: form }
        );
        toast.success(`${doc.identity_type_name} created`);
      }

      // 2️⃣ UPDATE
      else if (!isDocEqual(doc, existing)) {
        if (!doc.file && doc.identity_file_number !== existing.identity_file_number) {
          setError(`Please re-upload ${doc.identity_type_name}`);
          return;
        }

        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/identity-documents/${existing.identity_uuid}`,
          { method: "PUT", body: form }
        );
        toast.success(`${doc.identity_type_name} updated`);
      }

      // 3️⃣ SKIP – unchanged
    }

    router.push(`/onboarding/${token}/education-details`);
  } catch {
    toast.error("Failed to save identity documents");
    setError("Failed to save identity documents");
  }
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
              setDraft({
                country_uuid: e.target.value,
                documents: [],
              })
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
                    (d) => d.identity_type_uuid === doc.identity_type_uuid,
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
                    onChange={(e) => handleFileChange(doc, e.target.files?.[0])}
                  />
                </label>
                <span style={fileNameText}>
                  {documents.find(
                    (d) => d.identity_type_uuid === doc.identity_type_uuid,
                  )?.file?.name || "No file chosen"}
                </span>
              </div>

              {documents.some(
                (d) => d.identity_type_uuid === doc.identity_type_uuid,
              ) && (
                <div style={{ fontSize: 12, color: "green", marginTop: 4 }}>
                  
                </div>
              )}
            </Field>
          ))}

        {error && <div style={{ color: "red" }}>{error}</div>}

        <div style={footer}>
          <button
            type="button"
            onClick={() => router.push(`/onboarding/${token}/address-details`)}
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

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorageForm } from "../hooks/localStorage";
import toast from "react-hot-toast";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";

/* ===================== TYPES ===================== */

interface Country {
  country_uuid: string;
  country_name: string;
  is_active: boolean;
}

interface IdentityType {
  mapping_uuid: string;
  identity_type_uuid: string;
  identity_type_name: string;
  is_mandatory: boolean;
}

interface IdentityDocument {
  mapping_uuid: string;
  identity_uuid?: string;
  identity_type_uuid: string;
  identity_type_name: string;
  identity_file_number: string;
  file?: File;
  file_path?: string;
}


interface IdentityDraft {
  country_uuid: string;
  documents: (IdentityDocument & { file?: File })[];
}


/* ===================== COMPONENT ===================== */

export default function IdentityDocumentsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { setLoading: setGlobalLoading } = useGlobalLoading();


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


const [originalDraft, setOriginalDraft] = useState<IdentityDraft | null>(null);
const [userUuid, setUserUuid] = useState<string | null>(null);





  const [error, setError] = useState("");



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
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/identity/country-mapping/identities/${selectedCountry}`
  )
    .then((res) => res.json())
    .then((data) => {

      const list = Array.isArray(data) ? data : [];
      setIdentityTypes(list);
    })
    .catch(() => setError("Unable to load identity documents"));
}, [selectedCountry]);


useEffect(() => {
  if (!token) return;

  // snapshot draft ONLY once (after hydration)
  if (!originalDraft) {
    setOriginalDraft(JSON.parse(JSON.stringify(draft)));
  }

  // resolve user_uuid once
  if (!userUuid) {
    (async () => {
      try {
        const tokenRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
        );
        if (!tokenRes.ok) return;
        setUserUuid(await tokenRes.json());
      } catch {}
    })();
  }
}, [token, draft, originalDraft, userUuid]);

// Note: Swagger shows only POST and PUT for identity documents.
// No GET endpoint is available, so we avoid calling one here to prevent 405.

  





  /* ===================== FILE HANDLING ===================== */

  
    const handleFileChange = (identityType: IdentityType, file?: File) => {
  if (!file) return;

  const MAX_SIZE_MB = 5;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    setError(`File must be less than ${MAX_SIZE_MB} MB`);
    return;
  }

  setDraft((prev) => {
    const existing = prev.documents.find(
      (d) => d.identity_type_uuid === identityType.identity_type_uuid
    );

    const updatedDocs = existing
      ? prev.documents.map((d) =>
          d.identity_type_uuid === identityType.identity_type_uuid
            ? { ...d, file ,
              mapping_uuid: identityType.mapping_uuid,
            }
            : d
        )
      : [
          ...prev.documents,
          {
            mapping_uuid: identityType.mapping_uuid,
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
  setError("");
  setDraft((prev) => {
    const existing = prev.documents.find(
      (d) => d.identity_type_uuid === identityType.identity_type_uuid
    );

    const updatedDocs = existing
      ? prev.documents.map((d) =>
          d.identity_type_uuid === identityType.identity_type_uuid
            ? { ...d, identity_file_number: value,
              mapping_uuid: identityType.mapping_uuid,
             }
            : d
        )
      : [
          ...prev.documents,
          {
            mapping_uuid: identityType.mapping_uuid,
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
   const hasChanges = () => {
  if (!originalDraft) return true;

  const originalDocs = originalDraft.documents;

  for (const doc of documents) {
    const old = originalDocs.find(
      (d) => d.identity_type_uuid === doc.identity_type_uuid
    );

    if (!old) return true;
    if (old.identity_file_number !== doc.identity_file_number) return true;
    if (doc.file) return true;
  }

  return false;
};

const handleContinue = async () => {
  setGlobalLoading(true);
  try {
    if (!userUuid) throw new Error();

    const mandatoryDocs = identityTypes.filter((d) => d.is_mandatory);

    // Mandatory validation
    for (const type of mandatoryDocs) {
      const doc = documents.find(
        (d) => d.identity_type_uuid === type.identity_type_uuid
      );

      if (!doc || !doc.identity_file_number?.trim()) {
        setError(`Please complete ${type.identity_type_name}`);
        return;
      }

      // File required only if no existing identity on server
      if (!doc.identity_uuid && !doc.file) {
        setError(`Please upload ${type.identity_type_name}`);
        return;
      }
    }

    // 🟢 ACTION 3 — NO CHANGES
    if (!hasChanges()) {
      toast("No changes detected. Moving to next step.");
      router.push(`/onboarding/${token}/education-details`);
      return;
    }

    const resolveFilePath = (data: unknown) => {
      if (!data || typeof data !== "object") return undefined;
      const maybe = data as {
        file_path?: string;
        filePath?: string;
        identity_uuid?: string;
      };
      return {
        file_path:
          typeof maybe.file_path === "string"
            ? maybe.file_path
            : typeof maybe.filePath === "string"
              ? maybe.filePath
              : undefined,
        identity_uuid:
          typeof maybe.identity_uuid === "string"
            ? maybe.identity_uuid
            : undefined,
      };
    };

    for (const doc of documents) {
      const old = originalDraft?.documents.find(
        (d) => d.identity_type_uuid === doc.identity_type_uuid
      );

      const identityUuid = doc.identity_uuid || old?.identity_uuid;

      // 🟢 ACTION 1 — POST
      if (!identityUuid) {
        const form = new FormData();
        form.append("mapping_uuid", doc.mapping_uuid);
        form.append("user_uuid", userUuid);
        form.append("identity_file_number", doc.identity_file_number);
        if (doc.file) form.append("file", doc.file);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/identity-documents`,
          { method: "POST", body: form }
        );
        if (!res.ok) throw new Error();
        let filePath: string | undefined;
        let identityUuid: string | undefined;
        try {
          const data = await res.json();
          const resolved = resolveFilePath(data);
          if (resolved) {
            filePath = resolved.file_path;
            identityUuid = resolved.identity_uuid;
          }
        } catch {}
        if (filePath || identityUuid) {
          setDraft((prev) => ({
            ...prev,
            documents: prev.documents.map((d) =>
              d.identity_type_uuid === doc.identity_type_uuid
                ? {
                    ...d,
                    file_path: filePath ?? d.file_path,
                    identity_uuid: identityUuid ?? d.identity_uuid,
                  }
                : d
            ),
          }));
        }
        toast.success("Identity documents saved successfully");
      }

      // 🟢 ACTION 2 — PUT
      else if (
        !old ||
        old.identity_file_number !== doc.identity_file_number ||
        doc.file
      ) {
        const form = new FormData();
        form.append("identity_file_number", doc.identity_file_number);
        if (doc.file) form.append("file", doc.file);

        const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/identity-documents/${identityUuid}`;
        const res = await fetch(endpoint, { method: "PUT", body: form });
        if (!res.ok) throw new Error();
        let filePath: string | undefined;
        let newIdentityUuid: string | undefined;
        try {
          const data = await res.json();
          const resolved = resolveFilePath(data);
          if (resolved) {
            filePath = resolved.file_path;
            newIdentityUuid = resolved.identity_uuid;
          }
        } catch {}
        if (filePath || newIdentityUuid) {
          setDraft((prev) => ({
            ...prev,
            documents: prev.documents.map((d) =>
              d.identity_type_uuid === doc.identity_type_uuid
                ? {
                    ...d,
                    file_path: filePath ?? d.file_path,
                    identity_uuid: newIdentityUuid ?? d.identity_uuid,
                  }
                : d
            ),
          }));
        }
        toast.success("Identity documents updated successfully");
      }
    }

    router.push(`/onboarding/${token}/education-details`);
  } catch {
    toast.error("Failed to save identity documents");
  } finally {
    setGlobalLoading(false);
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
              });
              setOriginalDraft(null);
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
                  {(() => {
                    const existing = documents.find(
                      (d) => d.identity_type_uuid === doc.identity_type_uuid,
                    );
                    if (existing?.file) return existing.file.name;
                    if (existing?.file_path) {
                      return existing.file_path.split("/").pop();
                    }
                    return "No file chosen";
                  })()}
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

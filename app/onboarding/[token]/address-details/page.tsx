"use client";

import { useEffect, useState, useRef } from "react";
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

interface AddressForm {
  address_type: "permanent" | "current";
  address_line1: string;
  address_line2: string;
  city: string;
  district_or_ward: string;
  state_or_region: string;
  postal_code: string;
  country_uuid: string;
}

/** 👇 Draft structure stored in Zustand */
interface AddressDraft {
  permanent: AddressForm;
  current: AddressForm;
}

/* ===================== CONSTANT ===================== */

const emptyPermanentAddress: AddressForm = {
  address_type: "permanent",
  address_line1: "",
  address_line2: "",
  city: "",
  district_or_ward: "",
  state_or_region: "",
  postal_code: "",
  country_uuid: "",
};

const emptyTemporaryAddress: AddressForm = {
  address_type: "current",
  address_line1: "",
  address_line2: "",
  city: "",
  district_or_ward: "",
  state_or_region: "",
  postal_code: "",
  country_uuid: "",
};

/* ===================== COMPONENT ===================== */

export default function AddressDetailsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { setLoading: setGlobalLoading } = useGlobalLoading();
  const [countries, setCountries] = useState<Country[]>([]);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);
const [userUuid, setUserUuid] = useState<string | null>(null);

const [draft, setDraft  ] = useLocalStorageForm<AddressDraft>(
  `address-details-${token}`,
  {
    permanent: emptyPermanentAddress,
    current: emptyTemporaryAddress,
  }
);

const permanent = draft?.permanent ?? emptyPermanentAddress;
const current = draft?.current ?? emptyTemporaryAddress;

const [originalDraft, setOriginalDraft] = useState<AddressDraft | null>(null);
const [permanentUuid, setPermanentUuid] = useState<string | null>(null);
const [temporaryUuid, setTemporaryUuid] = useState<string | null>(null);
const isSubmittingRef = useRef(false);


function isEqual(a: AddressForm, b: AddressForm) {
  return JSON.stringify(a) === JSON.stringify(b);
}

  /* ---------------- FETCH COUNTRIES ---------------- */

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) =>
        setCountries(data.filter((c) => c.is_active))
      )
      .catch(() => setError("Failed to load countries"));
  }, []);

useEffect(() => {
  if (!token || hasLoadedRef.current) return;
  hasLoadedRef.current = true;

  try {
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
    )
      .then((res) => res.json())
      .then((uuid: string) => setUserUuid(uuid))
      .catch(() => {
        // ignore token verification errors
      });
  } catch {
    // ignore bad local storage
  }
}, [token]);

useEffect(() => {
  if (!token) return;
  const perm = localStorage.getItem(`address-uuid-permanent-${token}`);
  const temp = localStorage.getItem(`address-uuid-temporary-${token}`);
  if (perm) setPermanentUuid(perm);
  if (temp) setTemporaryUuid(temp);
  const storedSnapshot = localStorage.getItem(`address-snapshot-${token}`);
  if (storedSnapshot) {
    try {
      setOriginalDraft(JSON.parse(storedSnapshot) as AddressDraft);
    } catch {
      // ignore bad snapshot
    }
  }
}, [token]);
  /* ---------------- HANDLERS ---------------- */

  const handlePermanentChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  setDraft((prev) => {
    const updatedPermanent: AddressForm = {
      ...prev.permanent,
      address_type: "permanent" as const,
      [name]: value,
    };

  return {
    permanent: updatedPermanent,
    current: sameAsPermanent
      ? { ...updatedPermanent, address_type: "current" }
      : prev.current,
  };
});

};

  const handleTemporaryChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  setDraft((prev) => ({
    permanent: prev.permanent,
    current: { ...prev.current, 
      address_type: "current",
      [name]: value },
  }));
};

  const handleSameAsPermanent = (checked: boolean) => {
  setSameAsPermanent(checked);

  if (checked) {
    setDraft((prev) => ({
      permanent: prev.permanent ?? emptyPermanentAddress,
      current: { ...prev.current ?? emptyTemporaryAddress,
        address_type: "current",
      },
    }));
  }
};

const handleContinue = async () => {
  if (isSubmittingRef.current) return;
  isSubmittingRef.current = true;

  setError("");
  setGlobalLoading(true);

  try {
    if (!userUuid) throw new Error();

    // const saveAddress = async (
    //   current: AddressForm,
    //   original: AddressForm | null,
    //   uuid: string | null,
    //   setUuid: (id: string) => void
    // ) => {
    //   const payload = {
    //     user_uuid: userUuid,
    //     address_type: current.address_type,
    //     address_line1: current.address_line1,
    //     address_line2: current.address_line2,
    //     city: current.city,
    //     district_or_ward: current.district_or_ward,
    //     state_or_region: current.state_or_region,
    //     country_uuid: current.country_uuid,
    //     postal_code: current.postal_code,
       
    //   };

    //   // 🟢 FIRST TIME → POST
    //   if (!uuid) {
    //     const res = await fetch(
    //       `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/address`,
    //       {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify(payload),
    //       }
    //     );

    //     if (!res.ok) throw new Error();

    //     const data = await res.json();
    //     setUuid(data.address_uuid); // 🔥 critical
    //     if (current.address_type === "permanent") {
    //       localStorage.setItem(
    //         `address-uuid-permanent-${token}`,
    //         data.address_uuid
    //       );
    //     } else {
    //       localStorage.setItem(
    //         `address-uuid-temporary-${token}`,
    //         data.address_uuid
    //       );
    //     }

    //     toast.success(`${current.address_type} address saved`);
    //   }

    //   // 🔵 AFTER FIRST TIME → PUT (only if changed)
    //   else if (!original || !isEqual(original, current)) {
    //     const res = await fetch(
    //       `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-details/address/${uuid}`,
    //       {
    //         method: "PUT",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify(payload),
    //       }
    //     );

    //     if (!res.ok) throw new Error();

    //     toast.success(`${current.address_type} address updated`);
    //   }
    // };

    const saveAddress = async (
  current: AddressForm,
  original: AddressForm | null,
  uuid: string | null,
  setUuid: (id: string) => void
) => {
  const payload = {
    user_uuid: userUuid,
    address_type: current.address_type,
    address_line1: current.address_line1,
    address_line2: current.address_line2,
    city: current.city,
    district_or_ward: current.district_or_ward,
    state_or_region: current.state_or_region,
    country_uuid: current.country_uuid,
    postal_code: current.postal_code,
  };

  // 🟡 skip if no change
  if (uuid && original && isEqual(original, current)) return;

  // 🔵 UPDATE
  if (uuid) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-details/address/${uuid}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (res.status === 409) {
      const err = await res.json();
      toast.error(err.detail);
      return;
    }

    if (!res.ok) throw new Error();

    toast.success(`${current.address_type} address updated`);
  }

  // 🟢 CREATE
  else {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/address`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) throw new Error();

    const data = await res.json();
    const newUuid = data.address_uuid;

    setUuid(newUuid);

    if (current.address_type === "permanent") {
      localStorage.setItem(`address-uuid-permanent-${token}`, newUuid);
    } else {
      localStorage.setItem(`address-uuid-temporary-${token}`, newUuid);
    }

    toast.success(`${current.address_type} address saved`);
  }
};

    const permanentChanged =
      !originalDraft || !isEqual(originalDraft.permanent, permanent);

    const temporaryChanged =
      !sameAsPermanent &&
      (!originalDraft || !isEqual(originalDraft.current, current));

    // 🟡 NO CHANGES → JUST MOVE
    if (
      originalDraft &&
      !permanentChanged &&
      (sameAsPermanent || !temporaryChanged)
    ) {
      toast("No changes detected. Moving to next step.");
      router.push(`/onboarding/${token}/identity-documents`);
      return;
    }

    const tasks: Promise<void>[] = [];

    if (permanentChanged || !permanentUuid) {
      tasks.push(
        saveAddress(
          permanent,
          originalDraft?.permanent || null,
          permanentUuid,
          setPermanentUuid
        )
      );
    }

    if (!sameAsPermanent && (temporaryChanged || !temporaryUuid)) {
      tasks.push(
        saveAddress(
          current,
          originalDraft?.current|| null,
          temporaryUuid,
          setTemporaryUuid
        )
      );
    }

    await Promise.all(tasks);

    // Mirror permanent UUID into temporary when Same-as-Permanent
if (sameAsPermanent && permanentUuid) {
  setTemporaryUuid(permanentUuid);
  localStorage.setItem(`address-uuid-temporary-${token}`, permanentUuid);
}
  const snapshot: AddressDraft = {
  permanent: { ...permanent },
  current: sameAsPermanent
    ? { ...permanent, address_type: "current" }
    : { ...current },
};
    setOriginalDraft(snapshot);
    localStorage.setItem(
      `address-snapshot-${token}`,
      JSON.stringify(snapshot)
    );
    router.push(`/onboarding/${token}/identity-documents`);
  } catch {
    toast.error("Failed to save address details");
    setError("Failed to save address details");
  } finally {
    isSubmittingRef.current = false;
    setGlobalLoading(false);
  }
};
  /* ===================== UI ===================== */

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Address Details</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <h3 style={sectionTitle}>Permanent Address</h3>
        <AddressFormUI
          data={permanent}
          onChange={handlePermanentChange}
          countries={countries}
        />

        <label style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          <input
            type="checkbox"
            checked={sameAsPermanent}
            onChange={(e) => handleSameAsPermanent(e.target.checked)}
          />
          Same as Permanent Address
        </label>

        {!sameAsPermanent && (
          <>
            <h3 style={sectionTitle}>Temporary Address</h3>
            <AddressFormUI
              data={current}
              onChange={handleTemporaryChange}
              countries={countries}
            />
          </>
        )}

        <div style={{ textAlign: "right", marginTop: 24 }}>
          <button style={submitBtn} onClick={handleContinue}>
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== FORM ===================== */

function AddressFormUI({
  data,
  onChange,
  countries,
}: {
  data: AddressForm;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  countries: Country[];
}) {
  return (
    <>
      <Field label="Address Line 1">
        <input name="address_line1" value={data.address_line1} onChange={onChange} style={inputStyle} required />
      </Field>

      <Field label="Address Line 2">
        <input name="address_line2" value={data.address_line2} onChange={onChange} style={inputStyle} />
      </Field>

      <Field label="City">
        <input name="city" value={data.city} onChange={onChange} style={inputStyle} required />
      </Field>

      <Field label="District / Ward">
        <input name="district_or_ward" value={data.district_or_ward} onChange={onChange} style={inputStyle} required />
      </Field>

      <Field label="State / Region">
        <input name="state_or_region" value={data.state_or_region} onChange={onChange} style={inputStyle} required />
      </Field>

      <Field label="Postal Code">
        <input name="postal_code" value={data.postal_code} onChange={onChange} style={inputStyle} required />
      </Field>

      <Field label="Country">
        <select name="country_uuid" value={data.country_uuid} onChange={onChange} style={inputStyle} required>
          <option value="">Select Country</option>
          {countries.map((c) => (
            <option key={c.country_uuid} value={c.country_uuid}>
              {c.country_name}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

/* ===================== FIELD ===================== */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/* ===================== STYLES ===================== */

const pageWrapper = {
  backgroundColor: "#f5f7fb",
  padding: "32px 0",
};

const cardStyle = {
  maxWidth: 600,
  margin: "0 auto",
  backgroundColor: "#fff",
  padding: 24,
  borderRadius: 8,
};

const titleStyle = {
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 16,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 600,
  margin: "24px 0 12px",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 6,
  display: "block",
};

const inputStyle = {
  width: "100%",
  height: 40,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  padding: "0 12px",
};

const submitBtn = {
  backgroundColor: "#2563eb",
  color: "#fff",
  padding: "10px 20px", 
  borderRadius: 6,
  border: "none",
};

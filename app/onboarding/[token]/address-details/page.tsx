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
  address_type: "permanent" | "temporary";
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
  temporary: AddressForm;
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
  address_type: "temporary",
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
    temporary: emptyTemporaryAddress,
  }
);

const permanent = draft.permanent;
const temporary = draft.temporary;

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

  const loadAddresses = async () => {
    try {
      // 🔐 Verify token ONCE
      const tokenRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
      );
      if (!tokenRes.ok) return;

      const user_uuid: string = await tokenRes.json();
      setUserUuid(user_uuid);

      // 📦 Fetch address details
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-details/address/${user_uuid}`
      );
      if (!res.ok) return;

      const data = await res.json();

      const mapped: AddressDraft = {
        permanent: data.permanent || emptyPermanentAddress,
        temporary: data.temporary || emptyTemporaryAddress,
      };

      setOriginalDraft(mapped);
      setDraft({
  permanent: {
    ...mapped.permanent,
    address_type: "permanent",
  },
  temporary: {
    ...mapped.temporary,
    address_type: "temporary",
  },
});


      setPermanentUuid(data.permanent?.address_uuid ?? null);
      setTemporaryUuid(data.temporary?.address_uuid ?? null);
    } catch {
      // intentionally silent
    }
  };

  loadAddresses();
}, [token, setDraft]);

 

      


      
   

  
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
    temporary: sameAsPermanent
      ? { ...updatedPermanent, address_type: "temporary" }
      : prev.temporary,
  };
});

};

  const handleTemporaryChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  setDraft((prev) => ({
    permanent: prev.permanent,
    temporary: { ...prev.temporary, 
      address_type: "temporary",
      [name]: value },
  }));
};

  const handleSameAsPermanent = (checked: boolean) => {
  setSameAsPermanent(checked);

  if (checked) {
    setDraft((prev) => ({
      permanent: prev.permanent,
      temporary: { ...prev.permanent,
        address_type: "temporary",
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

    const saveAddress = async (
      current: AddressForm,
      original: AddressForm | null,
      uuid: string | null,
      setUuid: (id: string) => void
    ) => {
      const payload = {
        user_uuid: userUuid,
        ...current,
      };

      // 🟢 FIRST TIME → POST
      if (!uuid) {
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
        setUuid(data.address_uuid); // 🔥 critical

        toast.success(`${current.address_type} address saved`);
      }

      // 🔵 AFTER FIRST TIME → PUT (only if changed)
      else if (!original || !isEqual(original, current)) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-details/address/${uuid}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) throw new Error();

        toast.success(`${current.address_type} address updated`);
      }
    };

    const permanentChanged =
      !originalDraft || !isEqual(originalDraft.permanent, permanent);

    const temporaryChanged =
      !sameAsPermanent &&
      (!originalDraft || !isEqual(originalDraft.temporary, temporary));

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

    await saveAddress(
      permanent,
      originalDraft?.permanent || null,
      permanentUuid,
      setPermanentUuid
    );

    if (!sameAsPermanent) {
      await saveAddress(
        temporary,
        originalDraft?.temporary || null,
        temporaryUuid,
        setTemporaryUuid
      );
    }

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
              data={temporary}
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

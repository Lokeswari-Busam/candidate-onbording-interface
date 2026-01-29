"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorageForm } from "../hooks/localStorage";
/* ===================== TYPES ===================== */

interface Country {
  country_uuid: string;
  country_name: string;
  is_active: boolean;
}

interface AddressForm {
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

const emptyAddress: AddressForm = {
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



  const [countries, setCountries] = useState<Country[]>([]);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [error, setError] = useState("");

const [draft, setDraft  ] = useLocalStorageForm<AddressDraft>(
  `address-details-${token}`,
  {
    permanent: emptyAddress,
    temporary: emptyAddress,
  }
);

const permanent = draft.permanent;
const temporary = draft.temporary;



  /* ---------------- FETCH COUNTRIES ---------------- */

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) =>
        setCountries(data.filter((c) => c.is_active))
      )
      .catch(() => setError("Failed to load countries"));
  }, []);

  

  
  /* ---------------- HANDLERS ---------------- */

  const handlePermanentChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  setDraft((prev) => {
    const updatedPermanent = { ...prev.permanent, [name]: value };
    return {
      permanent: updatedPermanent,
      temporary: sameAsPermanent ? updatedPermanent : prev.temporary,
    };
  });
};

  const handleTemporaryChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  setDraft((prev) => ({
    permanent: prev.permanent,
    temporary: { ...prev.temporary, [name]: value },
  }));
};

  const handleSameAsPermanent = (checked: boolean) => {
  setSameAsPermanent(checked);

  if (checked) {
    setDraft((prev) => ({
      permanent: prev.permanent,
      temporary: prev.permanent,
    }));
  }
};

  const handleContinue = () => {

    router.push(`/onboarding/${token}/identity-documents`);
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

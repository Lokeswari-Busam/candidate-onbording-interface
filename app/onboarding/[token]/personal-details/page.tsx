"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorageForm } from "../hooks/localStorage";


/* ===================== TYPES ===================== */

interface Country {
  country_uuid: string;
  country_name: string;
  country_code: string;
  is_active: boolean;
}

interface OfferLetter {
  user_uuid: string;
  first_name: string;
  last_name: string;
  mail: string;
  country_code: string;
  contact_number: string;
}

interface PersonalForm {
  date_of_birth: string;
  gender: string;
  marital_status: string;
  blood_group: string;
  nationality_country_uuid: string;
  residence_country_uuid: string;
  emergency_country_uuid: string;
  emergency_contact: string;
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

interface RowProps {
  children: React.ReactNode;
}

/* ===================== COMPONENT ===================== */

export default function PersonalDetailsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [countries, setCountries] = useState<Country[]>([]);
  const [offer, setOffer] = useState<OfferLetter | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- FORM STATE ---------------- */

  const [formData, setFormData] =
  useLocalStorageForm<PersonalForm>(
    `personal-details-${token}`,
    {
      date_of_birth: "",
      gender: "",
      marital_status: "",
      blood_group: "",
      nationality_country_uuid: "",
      residence_country_uuid: "",
      emergency_country_uuid: "",
      emergency_contact: "",
    }
  );



  /* ---------------- FETCH COUNTRIES ---------------- */

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) => setCountries(data.filter((c) => c.is_active)))
      .catch(() => setError("Failed to load countries"));
  }, []);

  /* ---------------- TOKEN → USER → OFFER ---------------- */

  useEffect(() => {
  const loadOfferDetails = async () => {
    try {
      const tokenRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`,
      );
      if (!tokenRes.ok) throw new Error();

      const user_uuid: string = await tokenRes.json();

      const offerRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/offerletters/offer/${user_uuid}`,
      );
      if (!offerRes.ok) throw new Error();

      const offerData: OfferLetter = await offerRes.json();
      setOffer(offerData);
    } catch {
      setError("Invalid or expired onboarding link");
    }
  };

  if (token) {
    loadOfferDetails();
  }
}, [token]);


  /* ---------------- HANDLERS ---------------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

<<<<<<< HEAD
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/personal-details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_uuid,
            ...formData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save personal details");
      }

      router.push(`/onboarding/${token}/address-details`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
=======
    router.push(`/onboarding/${token}/address-details`);
>>>>>>> b884d4bda35897b891c62480c0ef3509504fca71
  };

  /* ===================== UI ===================== */

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Personal Details</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* 🔒 OFFER DETAILS */}
        {offer && (
          <>
            <Row>
              <ReadOnlyField label="First Name" value={offer.first_name} />
              <ReadOnlyField label="Last Name" value={offer.last_name} />
            </Row>

            <ReadOnlyField label="Email" value={offer.mail} />

            <Row>
              <ReadOnlyField
                label="Country Code"
                value={`+${offer.country_code}`}
              />
              <ReadOnlyField
                label="Contact Number"
                value={offer.contact_number}
              />
            </Row>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Date of Birth">
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </Field>

          <Field label="Gender">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Marital Status">
            <select
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select</option>
              <option>Single</option>
              <option>Married</option>
            </select>
          </Field>

          <Field label="Blood Group">
            <select
              name="blood_group"
              value={formData.blood_group}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>O+</option>
              <option>AB+</option>
            </select>
          </Field>

          <Field label="Nationality">
            <select
              name="nationality_country_uuid"
              value={formData.nationality_country_uuid}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.country_uuid} value={c.country_uuid}>
                  {c.country_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Residence Country">
            <select
              name="residence_country_uuid"
              value={formData.residence_country_uuid}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.country_uuid} value={c.country_uuid}>
                  {c.country_name}
                </option>
              ))}
            </select>
          </Field>          
    
        <Row>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Emergency Country Code</label>
                <select
                  name="emergency_country_uuid"
                  value={formData.emergency_country_uuid}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  <option value="">Select</option>
                  {countries.map((c) => (
                    <option key={c.country_uuid} value={c.country_uuid}>
                        {c.country_name} {c.country_code ? `(+${c.country_code})` : ""} 
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Emergency Contact</label>
                <input
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setFormData((prev) => ({ ...prev, emergency_contact: val }));
                  }}
                  style={inputStyle}
                  maxLength={10}
                  placeholder="Enter number"
                  required
                />
              </div>
            </Row>

          <div style={{ textAlign: "right", marginTop: 24 }}>
            <button type="submit" style={submitBtn} disabled={loading}>
              Save & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===================== REUSABLE COMPONENTS ===================== */

function Field({ label, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div style={{ marginBottom: 16, flex: 1 }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        disabled
        style={{ ...inputStyle, backgroundColor: "#f3f4f6" }}
      />
    </div>
  );
}

function Row({ children }: RowProps) {
  return <div style={{ display: "flex", gap: 12 }}>{children}</div>;
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
  marginBottom: 24,
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

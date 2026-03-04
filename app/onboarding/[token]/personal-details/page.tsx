"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorageForm } from "../hooks/localStorage";
import toast from "react-hot-toast";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";

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
  user_uuid?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;

  date_of_birth: string;
  gender: string;
  marital_status: string;
  blood_group: string;
  nationality_country_uuid: string;
  residence_country_uuid: string;
  emergency_contact_name: string;
emergency_contact_phone: string;
emergency_contact_relation_uuid: string;
 
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

interface Relation {
  relation_uuid: string;
  relation_name: string;
}

/* ===================== COMPONENT ===================== */

export default function PersonalDetailsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { setLoading: setGlobalLoading } = useGlobalLoading();

  const [countries, setCountries] = useState<Country[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [offer, setOffer] = useState<OfferLetter | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [personalUuid, setPersonalUuid] = useState<string | null>(null);
  const [originalPersonal, setOriginalPersonal] = useState<PersonalForm | null>(
    null
  );

  const hasLoadedRef = useRef(false);
  const isSubmittingRef = useRef(false);

  /* ---------------- FORM STATE ---------------- */

  const [formData, setFormData] = useLocalStorageForm<PersonalForm>(
    `personal-details-${token}`,
    {
      date_of_birth: "",
      gender: "",
      marital_status: "",
      blood_group: "",
      nationality_country_uuid: "",
      residence_country_uuid: "",
     emergency_contact_name: "",
emergency_contact_phone: "",
emergency_contact_relation_uuid: "",
    }
  );

  /* ---------------- FETCH COUNTRIES ---------------- */

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) => setCountries(data.filter((c) => c.is_active)))
      .catch(() => setError("Failed to load countries"));
  }, []);

  /* ---------------- FETCH RELATIONS ---------------- */

useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/relations`)
    .then((res) => res.json())
    .then((data: Relation[]) => setRelations(data))
    .catch(() => setError("Failed to load relations"));
}, []);

  /* ---------------- TOKEN → OFFER → PERSONAL ---------------- */

  useEffect(() => {
    if (!token || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        const tokenRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
        );
        if (!tokenRes.ok) return;

        const user_uuid: string = await tokenRes.json();

        const offerRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/offerletters/offer/${user_uuid}`
        );
        if (!offerRes.ok) return;

        const offerData = await offerRes.json();
        setOffer(offerData);

        setFormData((prev) => ({
          ...prev,
          user_uuid: offerData.user_uuid,
          first_name: offerData.first_name,
          last_name: offerData.last_name,
          email: offerData.mail,
          contact_number: offerData.contact_number,
        }));
      } catch {}
    };

    loadData();
  }, [token, setFormData]);

  useEffect(() => {
    if (!token) return;
    const storedUuid = localStorage.getItem(`personal-uuid-${token}`);
    if (storedUuid) {
      setPersonalUuid(storedUuid);
    }
    const storedSnapshot = localStorage.getItem(
      `personal-snapshot-${token}`
    );
    if (storedSnapshot) {
      try {
        setOriginalPersonal(JSON.parse(storedSnapshot) as PersonalForm);
      } catch {
        // ignore bad snapshot
      }
    }
  }, [token]);

  

  /* ---------------- HANDLERS ---------------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!offer) {
      toast.error("Offer details not loaded yet");
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setLoading(true);
    setGlobalLoading(true);
    setError("");
    console.log("Submitting payload:", formData);
console.log("personalUuid:", personalUuid);
    try {
      const payload = {
        user_uuid: offer.user_uuid,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        marital_status: formData.marital_status,
        blood_group: formData.blood_group,
        nationality_country_uuid: formData.nationality_country_uuid,
        residence_country_uuid: formData.residence_country_uuid,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relation_uuid: formData.emergency_contact_relation_uuid,
      };

      const isSame = (a: PersonalForm | null, b: any) => {
        if (!a) return false;
        return (
          (a.date_of_birth || "") === b.date_of_birth &&
          (a.gender || "") === b.gender &&
          (a.marital_status || "") === b.marital_status &&
          (a.blood_group || "") === b.blood_group &&
          (a.nationality_country_uuid || "") === b.nationality_country_uuid &&
          (a.residence_country_uuid || "") === b.residence_country_uuid &&
          (a.emergency_contact_name || "") === b.emergency_contact_name &&
          (a.emergency_contact_phone || "") === b.emergency_contact_phone &&
          (a.emergency_contact_relation_uuid || "") === b.emergency_contact_relation_uuid
        );
      };
      // no changes
      if (personalUuid && isSame(originalPersonal, payload)) {
        toast(" No changes detected");
        router.push(`/onboarding/${token}/address-details`);
        return;
      }
      // 🔵 FIRST TIME → POST
      if (!personalUuid) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/personal-details`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) throw new Error();

        const data = await res.json();

const uuid = data.personal_uuid;

setPersonalUuid(uuid);
localStorage.setItem(`personal-uuid-${token}`, uuid);

console.log("Saved personalUuid:", uuid);
        setOriginalPersonal({
          date_of_birth: payload.date_of_birth,
          gender: payload.gender,
          marital_status: payload.marital_status,
          blood_group: payload.blood_group,
          nationality_country_uuid: payload.nationality_country_uuid,
          residence_country_uuid: payload.residence_country_uuid,
          emergency_contact_name: payload.emergency_contact_name,
emergency_contact_phone: payload.emergency_contact_phone,
emergency_contact_relation_uuid: payload.emergency_contact_relation_uuid,
        });
        localStorage.setItem(
          `personal-snapshot-${token}`,
          JSON.stringify({
            date_of_birth: payload.date_of_birth,
            gender: payload.gender,
            marital_status: payload.marital_status,
            blood_group: payload.blood_group,
            nationality_country_uuid: payload.nationality_country_uuid,
            residence_country_uuid: payload.residence_country_uuid,
            emergency_contact_name: payload.emergency_contact_name,
emergency_contact_phone: payload.emergency_contact_phone,
emergency_contact_relation_uuid: payload.emergency_contact_relation_uuid,
          })
        );

       
        
        toast.success("Personal details saved successfully");
      }

      // 🔵 AFTER FIRST TIME → PUT
      else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-details/${personalUuid}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) throw new Error();

        setOriginalPersonal({
          date_of_birth: payload.date_of_birth,
          gender: payload.gender,
          marital_status: payload.marital_status,
          blood_group: payload.blood_group,
          nationality_country_uuid: payload.nationality_country_uuid,
          residence_country_uuid: payload.residence_country_uuid,
          emergency_contact_name: payload.emergency_contact_name,
          emergency_contact_phone: payload.emergency_contact_phone,
emergency_contact_relation_uuid: payload.emergency_contact_relation_uuid,
        });
        localStorage.setItem(
          `personal-snapshot-${token}`,
          JSON.stringify({
            date_of_birth: payload.date_of_birth,
            gender: payload.gender,
            marital_status: payload.marital_status,
            blood_group: payload.blood_group,
            nationality_country_uuid: payload.nationality_country_uuid,
            residence_country_uuid: payload.residence_country_uuid,
            emergency_contact_name: payload.emergency_contact_name,
emergency_contact_phone: payload.emergency_contact_phone,
emergency_contact_relation_uuid: payload.emergency_contact_relation_uuid,
          })
        );

        toast.success("Personal details updated successfully");
      }

      setTimeout(() => {
  router.push(`/onboarding/${token}/address-details`);
}, 200);
    } catch {
      toast.error("Failed to save personal details");
      setError("Failed to save personal details");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
      isSubmittingRef.current = false;
    }
  };

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


  /* ===================== UI ===================== */

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Personal Details</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

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
              value={formData?.date_of_birth || ""}
              onChange={handleChange}
              style={inputStyle}
            />
          </Field>

          <Field label="Gender">
            <select
              name="gender"
              value={formData?.gender || ""}
              onChange={handleChange}
              style={inputStyle}
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
              value={formData?.marital_status || ""}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Select</option>
              <option>Single</option>
              <option>Married</option>
            </select>
          </Field>

          <Field label="Blood Group">
            <select
              name="blood_group"
              value={formData?.blood_group || ""}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Select</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>AB+</option>
              <option>AB-</option>
              <option>O+</option>
              <option>O-</option>
            </select>
          </Field>

          <Field label="Nationality">
            <select
              name="nationality_country_uuid"
              value={formData?.nationality_country_uuid || ""}
              onChange={handleChange}
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

          <Field label="Residence Country">
            <select
              name="residence_country_uuid"
              value={formData?.residence_country_uuid || ""}
              onChange={handleChange}
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

           <Field label="Emergency Contact Name">
  <input
    name="emergency_contact_name"
    value={formData?.emergency_contact_name || ""}
    onChange={handleChange}
    style={inputStyle}
    placeholder="Enter name"
  />
</Field>

<Field label="Emergency Contact Phone">
  <input
    name="emergency_contact_phone"
    value={formData?.emergency_contact_phone || ""}
    onChange={(e) => {
      const val = e.target.value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, emergency_contact_phone: val }));
    }}
    style={inputStyle}
    maxLength={10}
    placeholder="Enter phone number"
  />
</Field>

<Field label="Emergency Contact Relation">
  <select
    name="emergency_contact_relation_uuid"
    value={formData?.emergency_contact_relation_uuid || ""}
    onChange={handleChange}
    style={inputStyle}
  >
    <option value="">Select Relation</option>
    {relations.map((r) => (
      <option key={r.relation_uuid} value={r.relation_uuid}>
        {r.relation_name}
      </option>
    ))}
  </select>
</Field>
            <div style={{ textAlign: "right", marginTop: 24 }}>
          <button disabled={isSubmittingRef.current} style={submitBtn} type="submit">{isSubmittingRef.current ? "Saving..." : "Save & Continue"} </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===================== STYLES (UNCHANGED) ===================== */

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

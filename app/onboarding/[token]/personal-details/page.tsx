 "use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* ===================== TYPES ===================== */

interface Country {
  country_uuid: string;
  country_name: string;
  is_active: boolean;
}

interface BasicInfo {
  first_name: string;
  last_name: string;
  email: string;
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

  /* -------- MOCK OFFER DATA -------- */
  const OFFER_DATA = {
    user_uuid: "019b214f-03de-a7a4-b752-5e5c055a87fc",
    first_name: "Ajay",
    last_name: "Kumar",
    mail: "217r1a6638@cmrtc.ac.in",
    country_code: "91",
    contact_number: "7446376372",
  };

  const user_uuid = OFFER_DATA.user_uuid;

  /* ---------------- STATE ---------------- */

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [basicInfo] = useState<BasicInfo>({
    first_name: OFFER_DATA.first_name,
    last_name: OFFER_DATA.last_name,
    email: OFFER_DATA.mail,
    country_code: OFFER_DATA.country_code,
    contact_number: OFFER_DATA.contact_number,
  });

  const [formData, setFormData] = useState<PersonalForm>({
    date_of_birth: "",
    gender: "",
    marital_status: "",
    blood_group: "",
    nationality_country_uuid: "",
    residence_country_uuid: "",
  });

  /* ---------------- FETCH COUNTRIES ---------------- */

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`
        );
        const data: Country[] = await res.json();
        setCountries(data.filter((c) => c.is_active));
      } catch (err) {
        console.error(err);
      }
    };

    fetchCountries();
  }, []);

  /* ---------------- HANDLERS ---------------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
  };

  /* ===================== UI ===================== */

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Personal Details</h2>

        <form onSubmit={handleSubmit}>
          <Row>
            <ReadOnlyField label="First Name" value={basicInfo.first_name} />
            <ReadOnlyField label="Last Name" value={basicInfo.last_name} />
          </Row>

          <ReadOnlyField label="Email" value={basicInfo.email} />

          <Row>
            <ReadOnlyField
              label="Country Code"
              value={`+${basicInfo.country_code}`}
            />
            <ReadOnlyField
              label="Contact Number"
              value={basicInfo.contact_number}
            />
          </Row>

          <Field label="Date of Birth">
            <input
              type="date"
              name="date_of_birth"
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </Field>

          <Field label="Gender">
            <select
              name="gender"
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

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={{ textAlign: "right", marginTop: 24 }}>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? "Saving..." : "Save & Continue"}
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
 // "use client";

  // import { useEffect, useState } from "react";
  // import { useParams, useRouter } from "next/navigation";

  // export default function PersonalDetailsPage() {
  //   const { token } = useParams();
  //   const router = useRouter();

  //   /* --------------------------------------------------
  //     MOCK OFFER RESPONSE (replace with GET /offer later)
  //   -------------------------------------------------- */
  //   const OFFER_DATA = {
  //     user_uuid: "019b214f-03de-a7a4-b752-5e5c055a87fc",
  //     first_name: "ajay",
  //     last_name: "kumar",
  //     mail: "217r1a6638@cmrtc.ac.in",
  //     country_code: "91",
  //     contact_number: "7446376372",
  //   };

  //   const user_uuid = OFFER_DATA.user_uuid;

  //   /* ---------------- STATE ---------------- */
  //   const [countries, setCountries] = useState([]);
  //   const [loading, setLoading] = useState(false);
  //   const [error, setError] = useState("");

  //   /* ---------- UI PREFILLED FIELDS ---------- */
  //   const [basicInfo, setBasicInfo] = useState({
  //     first_name: OFFER_DATA.first_name,
  //     last_name: OFFER_DATA.last_name,
  //     email: OFFER_DATA.mail,
  //     country_code: OFFER_DATA.country_code,
  //     contact_number: OFFER_DATA.contact_number,
  //   });

  //   /* ---------- BACKEND REQUIRED FIELDS ---------- */
  //   const [formData, setFormData] = useState({
  //     date_of_birth: "",
  //     gender: "",
  //     marital_status: "",
  //     blood_group: "",
  //     nationality_country_uuid: "",
  //     residence_country_uuid: "",
  //   });

  //   /* ---------------- FETCH COUNTRIES ---------------- */
  //   useEffect(() => {
  //     const fetchCountries = async () => {
  //       try {
  //         const res = await fetch(
  //           `${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`
  //         );
  //         const data = await res.json();

  //         const list = Array.isArray(data) ? data : [];
  //         setCountries(list.filter((c) => c.is_active === true));
  //       } catch (err) {
  //         console.error(err);
  //       }
  //     };

  //     fetchCountries();
  //   }, []);

  //   /* ---------------- HANDLERS ---------------- */
  //   const handleChange = (e) => {
  //     const { name, value } = e.target;
  //     setFormData((prev) => ({ ...prev, [name]: value }));
  //   };

  //   const handleSubmit = async (e) => {
  //     e.preventDefault();
  //     setError("");
  //     setLoading(true);

  //     try {
  //       const response = await fetch(
  //         `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-details`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({
  //             user_uuid,
  //             ...formData,
  //           }),
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to save personal details");
  //       }

  //       router.push(`/onboarding/${token}/address-details`);
  //     } catch (err) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   /* ---------------- UI ---------------- */
  //   return (
  //     <div style={pageWrapper}>
  //       <div style={cardStyle}>
  //         <h2 style={titleStyle}>Personal Details</h2>

  //         <form onSubmit={handleSubmit}>
  //           {/* Name */}
  //           <Row>
  //             <ReadOnlyField label="First Name" value={basicInfo.first_name} />
  //             <ReadOnlyField label="Last Name" value={basicInfo.last_name} />
  //           </Row>

  //           {/* Email */}
  //           <ReadOnlyField label="Email" value={basicInfo.email} />

  //           {/* Contact */}
  //           <Row>
  //             <ReadOnlyField label="Country Code" value={`+${basicInfo.country_code}`} />
  //             <ReadOnlyField label="Contact Number" value={basicInfo.contact_number} />
  //           </Row>

  //           {/* DOB */}
  //           <Field label="Date of Birth">
  //             <input
  //               type="date"
  //               name="date_of_birth"
  //               onChange={handleChange}
  //               style={inputStyle}
  //               required
  //             />
  //           </Field>

  //           {/* Gender */}
  //           <Field label="Gender">
  //             <select name="gender" onChange={handleChange} style={inputStyle} required>
  //               <option value="">Select</option>
  //               <option>Male</option>
  //               <option>Female</option>
  //               <option>Other</option>
  //             </select>
  //           </Field>

  //           {/* Marital Status */}
  //           <Field label="Marital Status">
  //             <select
  //               name="marital_status"
  //               onChange={handleChange}
  //               style={inputStyle}
  //               required
  //             >
  //               <option value="">Select</option>
  //               <option>Single</option>
  //               <option>Married</option>
  //             </select>
  //           </Field>

  //           {/* Blood Group */}
  //           <Field label="Blood Group">
  //             <select
  //               name="blood_group"
  //               onChange={handleChange}
  //               style={inputStyle}
  //               required
  //             >
  //               <option value="">Select</option>
  //               <option>A+</option>
  //               <option>A-</option>
  //               <option>B+</option>
  //               <option>O+</option>
  //               <option>AB+</option>
  //             </select>
  //           </Field>

  //           {/* Nationality */}
  //           <Field label="Nationality">
  //             <select
  //               name="nationality_country_uuid"
  //               onChange={handleChange}
  //               style={inputStyle}
  //               required
  //             >
  //               <option value="">Select Country</option>
  //               {countries.map((c) => (
  //                 <option key={c.country_uuid} value={c.country_uuid}>
  //                   {c.country_name}
  //                 </option>
  //               ))}
  //             </select>
  //           </Field>

  //           {/* Residence */}
  //           <Field label="Residence Country">
  //             <select
  //               name="residence_country_uuid"
  //               onChange={handleChange}
  //               style={inputStyle}
  //               required
  //             >
  //               <option value="">Select Country</option>
  //               {countries.map((c) => (
  //                 <option key={c.country_uuid} value={c.country_uuid}>
  //                   {c.country_name}
  //                 </option>
  //               ))}
  //             </select>
  //           </Field>

  //           {error && <p style={{ color: "red" }}>{error}</p>}

  //           <div style={{ textAlign: "right", marginTop: 24 }}>
  //             <button type="submit" disabled={loading} style={submitBtn}>
  //               {loading ? "Saving..." : "Save & Continue"}
  //             </button>
  //           </div>
  //         </form>
  //       </div>
  //     </div>
  //   );
  // }

  // /* ---------------- COMPONENTS ---------------- */

  // function Field({ label, children }) {
  //   return (
  //     <div style={{ marginBottom: 16 }}>
  //       <label style={labelStyle}>{label}</label>
  //       {children}
  //     </div>
  //   );
  // }

  // function ReadOnlyField({ label, value }) {
  //   return (
  //     <div style={{ marginBottom: 16, flex: 1 }}>
  //       <label style={labelStyle}>{label}</label>
  //       <input value={value} disabled style={{ ...inputStyle, background: "#f3f4f6" }} />
  //     </div>
  //   );
  // }

  // function Row({ children }) {
  //   return <div style={{ display: "flex", gap: 12 }}>{children}</div>;
  // }

  // /* ---------------- STYLES ---------------- */

  // const pageWrapper = {
  //   backgroundColor: "#f5f7fb",
  //   padding: "32px 0",
  // };

  // const cardStyle = {
  //   maxWidth: 600,
  //   margin: "0 auto",
  //   backgroundColor: "#fff",
  //   padding: 24,
  //   borderRadius: 8,
  // };

  // const titleStyle = {
  //   fontSize: 20,
  //   fontWeight: 600,
  //   marginBottom: 24,
  // };

  // const labelStyle = {
  //   fontSize: 13,
  //   fontWeight: 500,
  //   marginBottom: 6,
  //   display: "block",
  // };

  // const inputStyle = {
  //   width: "100%",
  //   height: 40,
  //   borderRadius: 6,
  //   border: "1px solid #d1d5db",
  //   padding: "0 12px",
  // };

  // const submitBtn = {
  //   backgroundColor: "#2563eb",
  //   color: "#fff",
  //   padding: "10px 20px",
  //   borderRadius: 6,
  //   border: "none",
  // };

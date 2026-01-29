"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AddressDetailsPage() {
  const { token } = useParams();
  const router = useRouter();

  // 🔹 MOCK user_uuid (same one used in Personal Details)
  const user_uuid = "019b214f-03de-a7a4-b752-5e5c055a87fc";

  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    address_type: "permanent",
    address_line1: "",
    address_line2: "",
    city: "",
    district_or_ward: "",
    state_or_region: "",
    postal_code: "",
    country_uuid: "",
  });

  /* ---------------- FETCH COUNTRIES ---------------- */
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`
        );
        const data = await res.json();

        const list = Array.isArray(data) ? data : [];
        setCountries(list.filter((c) => c.is_active === true));
      } catch (err) {
        console.error(err);
      }
    };

    fetchCountries();
  }, []);

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        user_uuid,
        address_type: formData.address_type,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2,
        city: formData.city,
        district_or_ward: formData.district_or_ward,
        state_or_region: formData.state_or_region,
        postal_code: String(formData.postal_code), // 🔴 important
        country_uuid: formData.country_uuid,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/address`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Internal server error. Please check address fields.");
      }

      // 👉 next onboarding step
       router.push(`/onboarding/${token}/education-details`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Address Details</h2>

        <form onSubmit={handleSubmit}>
          <Field label="Address Line 1">
            <input
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </Field>

          <Field label="Address Line 2">
            <input
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              style={inputStyle}
            />
          </Field>

          <Field label="City">
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </Field>

          <Field label="District / Ward">
            <input
              name="district_or_ward"
              value={formData.district_or_ward}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </Field>

          <Field label="State / Region">
            <input
              name="state_or_region"
              value={formData.state_or_region}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </Field>

          <Field label="Postal Code">
            <input
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </Field>

          <Field label="Country">
            <select
              name="country_uuid"
              value={formData.country_uuid}
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

          {error && (
            <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 24,
            }}
          >
            {/* 🔙 Back Button */}
            <button
              type="button"
              onClick={() =>
                router.push(`/onboarding/${token}/personal-details`)
              }
              style={backBtn}
            >
              ← Back
            </button>

            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- FIELD ---------------- */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const pageWrapper = {
  minHeight: "calc(100vh - 120px)",
  backgroundColor: "#f5f7fb",
  padding: "32px 0",
};

const cardStyle = {
  maxWidth: 520,
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: 8,
  padding: 24,
  boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
};

const titleStyle = {
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 24,
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 6,
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
  border: "none",
  padding: "10px 20px",
  borderRadius: 6,
  cursor: "pointer",
};

const backBtn = {
  background: "none",
  border: "none",
  color: "#2563eb",
  fontSize: 14,
  cursor: "pointer",
};

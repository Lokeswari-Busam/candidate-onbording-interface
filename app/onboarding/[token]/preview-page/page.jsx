"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/app/store/useOnboardingStore";

export default function OnboardingPreviewPage() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ===================== STORE ===================== */

  const {
    user_uuid,
    personalDetails,
    addresses = [],
    educationDetails = [],
    experienceDetails = [],
    identityDocuments = [],
  } = useOnboardingStore();

  /* ===================== VALIDATION ===================== */

  const isDataComplete = useMemo(() => {
    return Boolean(
      user_uuid &&
        personalDetails &&
        addresses.length > 0 &&
        educationDetails.length > 0 &&
        experienceDetails.length > 0 &&
        identityDocuments.length > 0
    );
  }, [
    user_uuid,
    personalDetails,
    addresses,
    educationDetails,
    experienceDetails,
    identityDocuments,
  ]);

  const isSubmitDisabled = !confirmed || !isDataComplete || loading;

  /* ===================== SUBMIT ===================== */

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;

    try {
      setLoading(true);

      const payload = {
        user_uuid,

        /* ---------- PERSONAL ---------- */
        personal_details: {
          user_uuid,
          first_name: personalDetails.first_name,
          last_name: personalDetails.last_name,
          email: personalDetails.email,
          contact_number: personalDetails.contact_number,
          date_of_birth: personalDetails.date_of_birth,
          gender: personalDetails.gender,
          marital_status: personalDetails.marital_status,
          blood_group: personalDetails.blood_group,
          nationality_country_uuid:
            personalDetails.nationality_country_uuid,
          residence_country_uuid:
            personalDetails.residence_country_uuid,
        },

        /* ---------- ADDRESSES ---------- */
        addresses: addresses.map((addr) => ({
          user_uuid,
          address_type: addr.address_type,
          address_line1: addr.address_line1,
          address_line2: addr.address_line2 || "",
          city: addr.city,
          district_or_ward: addr.district_or_ward || "",
          state_or_region: addr.state_or_region,
          postal_code: addr.postal_code,
          country_uuid: addr.country_uuid,
        })),

        /* ---------- EDUCATION ---------- */
        education_details: educationDetails.map((edu) => ({
          document_uuid: edu.document_uuid,
          mapping_uuid: edu.mapping_uuid,
          user_uuid,
          institution_name: edu.institution_name,
          specialization: edu.specialization,
          year_of_passing: Number(edu.year_of_passing),
          file_path: edu.file_path,
          status: "uploaded",
        })),

        /* ---------- EXPERIENCE ---------- */
        experience_details: experienceDetails.map((exp) => ({
          employee_uuid: user_uuid,
          company_name: exp.company_name,
          start_date: exp.start_date,
          end_date: exp.end_date || null,
          role_title: exp.role_title,
          employment_type: exp.employment_type,
          is_current: exp.is_current,
          remarks: exp.remarks || "",
        })),

        /* ---------- IDENTITY ---------- */
        identity_documents: identityDocuments.map((doc) => ({
          mapping_uuid: doc.mapping_uuid,
          file_path: doc.file_path,
        })),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/hr/candidate/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error("Submit failed");
      }

      alert("Onboarding submitted successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Submission failed ❌");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== UI ===================== */

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Preview & Submit Onboarding
      </h1>

      {!isDataComplete && (
        <p className="text-red-600">
          ⚠ Please complete all sections before submitting.
        </p>
      )}

      {/* ---------- PERSONAL ---------- */}
      <Section
        title="Personal Details"
        onEdit={() => router.push("/personal-details")}
      >
        {/* Offer-prefilled (read-only) */}
        <PreviewRow label="First Name" value={personalDetails?.first_name} />
        <PreviewRow label="Last Name" value={personalDetails?.last_name} />
        <PreviewRow label="Email" value={personalDetails?.email} />
        <PreviewRow
          label="Contact Number"
          value={personalDetails?.contact_number}
        />

        {/* <hr className="my-3" /> */}

        {/* User-entered */}
        <PreviewRow
          label="Date of Birth"
          value={personalDetails?.date_of_birth}
        />
        <PreviewRow label="Gender" value={personalDetails?.gender} />
        <PreviewRow
          label="Marital Status"
          value={personalDetails?.marital_status}
        />
        <PreviewRow
          label="Blood Group"
          value={personalDetails?.blood_group}
        />
      </Section>

      {/* ---------- ADDRESSES ---------- */}
      <Section
        title="Addresses"
        onEdit={() => router.push("/address-details")}
      >
        {addresses.map((addr, idx) => (
          <div key={idx} className="border p-3 rounded mb-3">
            <PreviewRow label="Type" value={addr.address_type} />
            <PreviewRow label="City" value={addr.city} />
            <PreviewRow label="State" value={addr.state_or_region} />
            <PreviewRow
              label="Postal Code"
              value={addr.postal_code}
            />
          </div>
        ))}
      </Section>

      {/* ---------- EDUCATION ---------- */}
      <Section
        title="Education Details"
        onEdit={() => router.push("/education-details")}
      >
        {educationDetails.map((edu, idx) => (
          <div key={idx} className="border p-3 rounded mb-3">
            <PreviewRow
              label="Institution"
              value={edu.institution_name}
            />
            <PreviewRow
              label="Specialization"
              value={edu.specialization}
            />
            <PreviewRow
              label="Year of Passing"
              value={edu.year_of_passing}
            />
          </div>
        ))}
      </Section>

      {/* ---------- EXPERIENCE ---------- */}
      <Section
        title="Experience Details"
        onEdit={() => router.push("/experience-details")}
      >
        {experienceDetails.map((exp, idx) => (
          <div key={idx} className="border p-3 rounded mb-3">
            <PreviewRow
              label="Company"
              value={exp.company_name}
            />
            <PreviewRow label="Role" value={exp.role_title} />
            <PreviewRow
              label="Employment Type"
              value={exp.employment_type}
            />
          </div>
        ))}
      </Section>

      {/* ---------- IDENTITY ---------- */}
      <Section
        title="Identity Documents"
        onEdit={() => router.push("/identity-documents")}
      >
        {identityDocuments.map((doc, idx) => (
          <div key={idx} className="border p-3 rounded mb-3">
            <PreviewRow
              label="Mapping UUID"
              value={doc.mapping_uuid}
            />
            <PreviewRow
              label="File Path"
              value={doc.file_path}
            />
          </div>
        ))}
      </Section>

      {/* ---------- CONFIRM ---------- */}
      <div className="border rounded p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>
            I confirm that all details provided above are correct
          </span>
        </label>
      </div>

      {/* ---------- SUBMIT ---------- */}
      <div className="flex justify-end">
        <button
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
          className={`px-6 py-2 rounded text-white ${
            isSubmitDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Submitting..." : "Submit Onboarding"}
        </button>
      </div>
    </div>
  );
}

/* ===================== REUSABLE COMPONENTS ===================== */

function Section({ title, children, onEdit }) {
  return (
    <div className="border rounded p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={onEdit}
          className="text-blue-600 hover:underline text-sm"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-1">
      <span className="font-medium">{label}</span>
      <span className="col-span-2 text-gray-700">
        {value && String(value).trim() !== "" ? value : "Not Provided"}
      </span>
    </div>
  );
}
// "use client";

// import { useState, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import { useOnboardingStore } from "@/app/store/useOnboardingStore";

// export default function OnboardingPreviewPage() {
//   const router = useRouter();
//   const [confirmed, setConfirmed] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const {
//   user_uuid,
//   personalDetails,
//   addresses = [],
//   educationDetails = [],
//   experienceDetails = [],
//   identityDocuments = [],
// } = useOnboardingStore();


//   /* ===================== VALIDATION ===================== */

//   const isDataComplete = useMemo(() => {
//     return Boolean(
//       user_uuid &&
//         personalDetails &&
//         addresses?.length > 0 &&
//         educationDetails?.length > 0 &&
//         experienceDetails?.length > 0 &&
//         identityDocuments?.length > 0
//     );
//   }, [
//     user_uuid,
//     personalDetails,
//     addresses,
//     educationDetails,
//     experienceDetails,
//     identityDocuments,
//   ]);

//   const isSubmitDisabled = !confirmed || !isDataComplete || loading;

//   /* ===================== SUBMIT ===================== */

//   const handleSubmit = async () => {
//     if (isSubmitDisabled) return;

//     try {
//       setLoading(true);

//       const payload = {
//         user_uuid,

//         personal_details: {
//           user_uuid,
//           date_of_birth: personalDetails.date_of_birth,
//           gender: personalDetails.gender,
//           marital_status: personalDetails.marital_status,
//           blood_group: personalDetails.blood_group,
//           nationality_country_uuid:
//             personalDetails.nationality_country_uuid,
//           residence_country_uuid:
//             personalDetails.residence_country_uuid,
//         },

//         addresses: addresses.map((addr) => ({
//           user_uuid,
//           address_type: addr.address_type,
//           address_line1: addr.address_line1,
//           address_line2: addr.address_line2 || "",
//           city: addr.city,
//           district_or_ward: addr.district_or_ward || "",
//           state_or_region: addr.state_or_region,
//           postal_code: addr.postal_code,
//           country_uuid: addr.country_uuid,
//         })),

//         education_details: educationDetails.map((edu) => ({
//           document_uuid: edu.document_uuid,
//           mapping_uuid: edu.mapping_uuid,
//           user_uuid,
//           institution_name: edu.institution_name,
//           specialization: edu.specialization,
//           year_of_passing: Number(edu.year_of_passing),
//           file_path: edu.file_path,
//           status: "uploaded",
//         })),

//         experience_details: experienceDetails.map((exp) => ({
//           employee_uuid: user_uuid,
//           company_name: exp.company_name,
//           start_date: exp.start_date,
//           end_date: exp.end_date || null,
//           role_title: exp.role_title,
//           employment_type: exp.employment_type,
//           is_current: exp.is_current,
//           remarks: exp.remarks || "",
//         })),

//         identity_documents: identityDocuments.map((doc) => ({
//           mapping_uuid: doc.mapping_uuid,
//           file_path: doc.file_path,
//         })),
//       };

//       const res = await fetch( `${process.env.NEXT_PUBLIC_API_BASE_URL}/hr/candidate/submit`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         throw new Error("Submit failed");
//       }

//       alert("Onboarding submitted successfully ✅");
//     } catch (err) {
//       console.error(err);
//       alert("Submission failed ❌");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ===================== UI ===================== */

//   return (
//     <div className="max-w-5xl mx-auto p-6 space-y-6">
//       <h1 className="text-2xl font-bold">
//         Preview & Submit Onboarding
//       </h1>

//       {!isDataComplete && (
//         <p className="text-red-600">
//           ⚠ Please complete all sections before submitting.
//         </p>
//       )}

//       <Section title="Personal Details" onEdit={() => router.push("/personal-details")}>
//         <PreviewRow label="Date of Birth" value={personalDetails?.date_of_birth} />
//         <PreviewRow label="Gender" value={personalDetails?.gender} />
//         <PreviewRow label="Marital Status" value={personalDetails?.marital_status} />
//         <PreviewRow label="Blood Group" value={personalDetails?.blood_group} />
//       </Section>

//       <Section title="Addresses" onEdit={() => router.push("/address-details")}>
//         {addresses.map((addr, idx) => (
//           <div key={idx} className="border p-3 rounded mb-3">
//             <PreviewRow label="Type" value={addr.address_type} />
//             <PreviewRow label="City" value={addr.city} />
//             <PreviewRow label="State" value={addr.state_or_region} />
//             <PreviewRow label="Postal Code" value={addr.postal_code} />
//           </div>
//         ))}
//       </Section>

//       <Section title="Education Details" onEdit={() => router.push("/education-details")}>
//         {educationDetails.map((edu, idx) => (
//           <div key={idx} className="border p-3 rounded mb-3">
//             <PreviewRow label="Institution" value={edu.institution_name} />
//             <PreviewRow label="Specialization" value={edu.specialization} />
//             <PreviewRow label="Year of Passing" value={edu.year_of_passing} />
//           </div>
//         ))}
//       </Section>

//       <Section title="Experience Details" onEdit={() => router.push("/experience-details")}>
//         {experienceDetails.map((exp, idx) => (
//           <div key={idx} className="border p-3 rounded mb-3">
//             <PreviewRow label="Company" value={exp.company_name} />
//             <PreviewRow label="Role" value={exp.role_title} />
//             <PreviewRow label="Employment Type" value={exp.employment_type} />
//           </div>
//         ))}
//       </Section>

//       <Section title="Identity Documents" onEdit={() => router.push("/identity-documents")}>
//         {identityDocuments.map((doc, idx) => (
//           <div key={idx} className="border p-3 rounded mb-3">
//             <PreviewRow label="Mapping UUID" value={doc.mapping_uuid} />
//             <PreviewRow label="File Path" value={doc.file_path} />
//           </div>
//         ))}
//       </Section>

//       <div className="border rounded p-4">
//         <label className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             checked={confirmed}
//             onChange={(e) => setConfirmed(e.target.checked)}
//           />
//           <span>
//             I confirm that all details provided above are correct
//           </span>
//         </label>
//       </div>

//       <div className="flex justify-end">
//         <button
//           disabled={isSubmitDisabled}
//           onClick={handleSubmit}
//           className={`px-6 py-2 rounded text-white ${
//             isSubmitDisabled
//               ? "bg-gray-400 cursor-not-allowed"
//               : "bg-green-600 hover:bg-green-700"
//           }`}
//         >
//           {loading ? "Submitting..." : "Submit Onboarding"}
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ===================== HELPERS ===================== */

// function Section({ title, children, onEdit }) {
//   return (
//     <div className="border rounded p-4">
//       <div className="flex justify-between items-center mb-3">
//         <h2 className="text-lg font-semibold">{title}</h2>
//         <button
//           onClick={onEdit}
//           className="text-blue-600 hover:underline text-sm"
//         >
//           Edit
//         </button>
//       </div>
//       {children}
//     </div>
//   );
// }

// function PreviewRow({ label, value }) {
//   return (
//     <div className="grid grid-cols-3 gap-2 mb-1">
//       <span className="font-medium">{label}</span>
//       <span className="col-span-2 text-gray-700">
//         {value || "-"}
//       </span>
//     </div>
//   );
// }

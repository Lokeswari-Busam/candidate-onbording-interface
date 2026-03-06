"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLocalStorageForm } from "../hooks/localStorage";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";

/* ===================== TYPES ===================== */

interface PersonalDetails {
  user_uuid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  blood_group?: string;
  nationality_country_uuid?: string;
  residence_country_uuid?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation_uuid?: string;
}

interface Address {
  address_type: "permanent" | "current";
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district_or_ward?: string;
  state_or_region?: string;
  postal_code?: string;
  country_uuid?: string;
}

interface Country {
  country_uuid: string;
  country_name: string;
  is_active: boolean;
}

interface Relation {
    relation_uuid: string;
    relation_name: string;
}



interface Education {
  education_name: string;
  institution_name?: string;
  institute_location?: string;
  education_mode?: string;
  start_year?: number | string;
  specialization?: string;
  year_of_passing?: number | string;
  percentage_cgpa?: number | string;
  delay_reason?: string;
  documents?: {
    document_name: string;
    file_path?: string;
  }[];
}

interface ExperienceDocument {
  document_name?: string;
  doc_type?: string;
  file?: File;
  file_path?: string;
}

interface Experience {
  experience_uuid: string;
  file_path?: string;
  company_name?: string;
  start_date?: string;
  end_date?: string | null;
  role_title?: string;
  employment_type?: string;
  is_current?: boolean;
  remarks?: string;
  documents?: ExperienceDocument[];
}

interface IdentityDraft {
  country_uuid: string;
  documents: IdentityDocument[];
}


interface IdentityDocument {
  mapping_uuid: string;
  identity_type_uuid: string;
  identity_type_name: string;   // ✅ document name
  identity_file_number: string;
  file?: File;                   // ✅ uploaded file object
  file_path?: string;
}

/* ===================== COMPONENT ===================== */

export default function OnboardingPreviewPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setLoading: setGlobalLoading } = useGlobalLoading();
  const [countries, setCountries] = useState<Country[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);

  const [mounted, setMounted] = useState(false);

  const isSubmittedRef = React.useRef(false);


  const getAddressDisplayName = (type?: string) => {
  if (!type) return "Address";

  switch (type.toLowerCase()) {
    case "permanent":
          return "Permanent Address";
        case "temporary":
          return "Temporary Address";
        default:
          return "Temporary Address";
      }
    };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) =>
        setCountries((Array.isArray(data) ? data : []).filter((c) => c.is_active)),
      )
      .catch(() => {
        // ignore country lookup errors
      });
  }, []);
  useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/relations`)
    .then((res) => res.json())
    .then((data: Relation[]) => setRelations(data))
    .catch(() => {});
}, []);

  /* ===================== LOCAL STORAGE (TOKEN SCOPED) ===================== */

  const [personalDetails, , clearPersonal] =
    useLocalStorageForm<PersonalDetails | null>(
      `personal-details-${token}`,
      null
    );

  const [addressData, , clearAddress] =
    useLocalStorageForm<Record<string, Address>>(
      `address-details-${token}`,
      {}
    );


  const [educationDetails, setEducationDetails, clearEducation] =
    useLocalStorageForm<Education[]>(
      `education-details-${token}`,
      []
    );

  const [experienceDetails, setExperienceDetails, clearExperience] =
    useLocalStorageForm<Experience[]>(
      `experience-details-${token}`,
      []
    );

  const [identityDraft, setIdentityDraft, clearIdentity] =
  useLocalStorageForm<IdentityDraft>(
    `identity-details-${token}`,
    {
      country_uuid: "",
      documents: [],
    }
  );

  


  const user_uuid = personalDetails?.user_uuid;

  useEffect(() => {
    if (!mounted || !token) return;
    if (isSubmittedRef.current) return;

    let cancelled = false;

    const backfillEducation = async () => {
      if (isSubmittedRef.current) return;
      if (educationDetails.length === 0) return;
      const hasMissing = educationDetails.some((edu) =>
        edu.documents?.some((doc) => !doc.file_path),
      );
      if (!hasMissing) return;

      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const countryUuid = "019a8135-42fc-17ed-4825-f5a4634898fb";

        const [mappingRes, docsRes] = await Promise.all([
          fetch(`${base}/education/country-mapping/${countryUuid}`),
          fetch(`${base}/education/employee-education-document?token=${token}`),
        ]);
        if (!mappingRes.ok || !docsRes.ok) return;

        const mappingData = await mappingRes.json();
        const docsData = await docsRes.json();
        const mappings = Array.isArray(mappingData) ? mappingData : [];
        const uploads = Array.isArray(docsData) ? docsData : [];

        const mapByUuid = new Map(
          mappings.map(
            (m: {
              mapping_uuid: string;
              document_name: string;
              education_name: string;
            }) => [
              m.mapping_uuid,
              {
                document_name: m.document_name,
                education_name: m.education_name,
              },
            ],
          ),
        );

        const uploadByEduAndDoc = new Map<string, string>();
        uploads.forEach((u: { mapping_uuid?: string; file_path?: string }) => {
          if (!u.mapping_uuid || !u.file_path) return;
          const mapped = mapByUuid.get(u.mapping_uuid);
          if (!mapped) return;
          const key = `${mapped.education_name}::${mapped.document_name}`;
          uploadByEduAndDoc.set(key, u.file_path);
        });

        if (uploadByEduAndDoc.size === 0) return;

        if (!cancelled) {
          setEducationDetails((prev) =>
            prev.map((edu) => ({
              ...edu,
              documents: (edu.documents || []).map((doc) => {
                if (doc.file_path) return doc;
                const key = `${edu.education_name}::${doc.document_name}`;
                const file_path = uploadByEduAndDoc.get(key);
                return file_path ? { ...doc, file_path } : doc;
              }),
            })),
          );
        }
      } catch {
        // ignore backfill errors
      }
    };


    const backfillExperience = async () => {
      const hasMissing = experienceDetails.some((exp) =>
        exp.documents?.some((doc) => !doc.file_path),
      );
      if (!hasMissing) return;
      if (!user_uuid) return;

      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const endpoints = [
          `${base}/experience/employee-experience?token=${token}`,
          `${base}/experience/employee/${user_uuid}`,
        ];

        let uploads: Array<{
          documents?: { doc_type?: string; file_path?: string }[];
          experience_uuid?: string;
        }> = [];

        for (const url of endpoints) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            uploads = Array.isArray(data) ? data : [];
            if (uploads.length > 0) break;
          } catch {
            // try next endpoint
          }
        }

        if (uploads.length === 0) return;

        if (!cancelled) {
          setExperienceDetails((prev) =>
            prev.map((exp) => {
              const match = uploads.find(
                (u) =>
                  u.experience_uuid && u.experience_uuid === exp.experience_uuid,
              );
              if (!match?.documents) return exp;
              return {
                ...exp,
                documents: (exp.documents || []).map((doc) => {
                  if (doc.file_path) return doc;
                  const found = match.documents?.find(
                    (d) => d.doc_type && d.doc_type === doc.doc_type,
                  );
                  return found?.file_path
                    ? { ...doc, file_path: found.file_path }
                    : doc;
                }),
              };
            }),
          );
        }
      } catch {
        // ignore backfill errors
      }
    };

    void backfillEducation();
    // Identity backfill skipped: Swagger shows no GET endpoint for identity docs.
    void backfillExperience();

    return () => {
      cancelled = true;
    };
  }, [
    mounted,
    token,
    educationDetails,
    experienceDetails,
    identityDraft,
    user_uuid,
    setEducationDetails,
    setExperienceDetails,
    setIdentityDraft,
  ]);

  /* ===================== TRANSFORM ADDRESSES ===================== */

  const addresses = useMemo<Address[]>(() => {
    return Object.values(addressData);
  }, [addressData]);

 const permanentAddress = addresses.find(
    (a) => a.address_type === "permanent"
  );

  const temporaryAddress = addresses.find(
    (a) => a.address_type === "current"
  );

  const hasAddressData = (addr?: Address) =>
    !!(
      addr?.address_line1?.trim() ||
      addr?.address_line2?.trim() ||
      addr?.city?.trim() ||
      addr?.district_or_ward?.trim() ||
      addr?.state_or_region?.trim() ||
      addr?.postal_code?.trim()
    );

  // If temporary has no data → treat as same
  const isTemporaryEmpty = !hasAddressData(temporaryAddress);

  // Check if values are same
  const areAddressesSame =
    permanentAddress &&
    temporaryAddress &&
    permanentAddress.address_line1 === temporaryAddress.address_line1 &&
    permanentAddress.address_line2 === temporaryAddress.address_line2 &&
    permanentAddress.city === temporaryAddress.city &&
    permanentAddress.district_or_ward === temporaryAddress.district_or_ward &&
    permanentAddress.state_or_region === temporaryAddress.state_or_region &&
    permanentAddress.postal_code === temporaryAddress.postal_code;

  // FINAL condition
  const showCombined =
    permanentAddress &&
    (isTemporaryEmpty || areAddressesSame);

 const identityList = useMemo<IdentityDocument[]>(() => {
  return Array.isArray(identityDraft?.documents)
    ? identityDraft.documents
    : [];
}, [identityDraft]);



const educationList = useMemo<Education[]>(() => {
  return Array.isArray(educationDetails) ? educationDetails : [];
}, [educationDetails]);



  /* ===================== VALIDATION ===================== */

  const isDataComplete = useMemo(() => {
    return Boolean(
      user_uuid &&
        personalDetails &&
        addresses.length > 0 &&
        educationList.length > 0 &&
        experienceDetails.length > 0 &&
        identityList.length > 0
    );
  }, [
    user_uuid,
    personalDetails,
    addresses,
    educationList,
    experienceDetails,
    identityList,
  ]);

  const isSubmitDisabled = !confirmed || !isDataComplete || loading;

  /* ===================== SUBMIT ===================== */

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error("Please confirm the details before submitting");
      return;
    }

    if (!isDataComplete || !personalDetails) {
      toast.error("Please complete all onboarding sections");
      return;
    }

    try {
      setLoading(true);
      setGlobalLoading(true);

      const payload = {
        user_uuid
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/hr/candidate/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error();

      isSubmittedRef.current = true;

      /* ✅ CLEAR DRAFT ONLY AFTER SUCCESS */
      clearPersonal();
      clearAddress();
      clearEducation();
      clearExperience();
      clearIdentity();

      toast.success("Onboarding submitted successfully ✅");
      router.push(`/onboarding/${token}/success`);
    } catch {
      toast.error("Submission failed ❌ Your draft is safe.");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

   if (!mounted) {
    return null;
  }
  function PreviewRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const display =
    value && String(value).trim() !== "" ? String(value) : "-";
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <span className="col-span-2 text-gray-700">
        {display}
      </span>
    </div>
  );
}

function getFileName(path?: string) {
  if (!path) return "No file uploaded";
  return path.split("/").pop();
}

function getCountryName(countries: Country[], uuid?: string) {
  if (!uuid) return "-";
  return countries.find((c) => c.country_uuid === uuid)?.country_name || uuid;
}
function getRelationName(relations: Relation[], uuid?: string) {
  if (!uuid) return "-";
  return (
    relations.find((r) => r.relation_uuid === uuid)?.relation_name || uuid
  );
}


function Section({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">
          {title}
        </h2>
        <button
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Edit
        </button>
      </div>

      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
}



  /* ===================== UI ===================== */

  return (
  <div className="max-w-5xl mx-auto p-6 space-y-6 bg-gray-50 min--screen">
    {/* HEADER */}
    <h1 className="text-2xl font-semibold">Preview & Submit Onboarding</h1>

    {!isDataComplete && (
      <p className="text-red-600 text-sm">
        ⚠ Please complete all sections before submitting.
      </p>
    )}
    <p className="text-sm text-gray-500">
      Please review all details before final submission
    </p>

    {/* ================= PERSONAL DETAILS ================= */}
    <Section
      title="Personal Details"
      onEdit={() => router.push(`/onboarding/${token}/personal-details`)}
    >
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2">
        <PreviewRow label="First Name" value={personalDetails?.first_name} />
        <PreviewRow label="Last Name" value={personalDetails?.last_name} />
          <PreviewRow label="Email" value={personalDetails?.email} />
        <PreviewRow
          label="Contact Number"
          value={personalDetails?.contact_number}
        />
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

        <PreviewRow
          label="Nationality"
          value={getCountryName(countries, personalDetails?.nationality_country_uuid)}
        />
        <PreviewRow
          label="Residence"
          value={getCountryName(countries, personalDetails?.residence_country_uuid)}
        />
       <PreviewRow
  label="Emergency Contact Name"
  value={personalDetails?.emergency_contact_name}
/>

<PreviewRow
  label="Emergency Contact Phone"
  value={personalDetails?.emergency_contact_phone}
/>

<PreviewRow
  label="Emergency Contact Relation"
  value={getRelationName(relations, personalDetails?.emergency_contact_relation_uuid)}
/>
      </div>
    </Section>

    {/* ================= ADDRESS DETAILS ================= */}
    <Section
      title="Address Details"
      onEdit={() => router.push(`/onboarding/${token}/address-details`)}
    >
      {showCombined ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2">
          <h3 className="font-semibold mb-3">
            Permanent & Temporary Address
          </h3>

          <PreviewRow label="Address Line 1" value={permanentAddress?.address_line1} />
          <PreviewRow label="Address Line 2" value={permanentAddress?.address_line2} />
          <PreviewRow label="City" value={permanentAddress?.city} />
          <PreviewRow label="District / Ward" value={permanentAddress?.district_or_ward} />
          <PreviewRow label="State / Region" value={permanentAddress?.state_or_region} />
          <PreviewRow label="Postal Code" value={permanentAddress?.postal_code} />
        </div>
      ) : (
        <>
          {permanentAddress && hasAddressData(permanentAddress) && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2">
              <h3 className="font-semibold mb-3">Permanent Address</h3>

              <PreviewRow label="Address Line 1" value={permanentAddress.address_line1} />
              <PreviewRow label="Address Line 2" value={permanentAddress.address_line2} />
              <PreviewRow label="City" value={permanentAddress.city} />
              <PreviewRow label="District / Ward" value={permanentAddress.district_or_ward} />
              <PreviewRow label="State / Region" value={permanentAddress.state_or_region} />
              <PreviewRow label="Postal Code" value={permanentAddress.postal_code} />
            </div>
          )}

          {temporaryAddress && hasAddressData(temporaryAddress) && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2">
              <h3 className="font-semibold mb-3">Temporary Address</h3>

              <PreviewRow label="Address Line 1" value={temporaryAddress.address_line1} />
              <PreviewRow label="Address Line 2" value={temporaryAddress.address_line2} />
              <PreviewRow label="City" value={temporaryAddress.city} />
              <PreviewRow label="District / Ward" value={temporaryAddress.district_or_ward} />
              <PreviewRow label="State / Region" value={temporaryAddress.state_or_region} />
              <PreviewRow label="Postal Code" value={temporaryAddress.postal_code} />
            </div>
          )}
        </>
      )}
    </Section>

    {/* ================= IDENTITY DOCUMENTS ================= */}
    <Section
    title="Identity Documents"
    onEdit={() => router.push(`/onboarding/${token}/identity-documents`)}
  >
    {identityList.map((doc, idx) => (
      <div
        key={idx}
        className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2"
      >
        <PreviewRow label="Document Type" value={doc.identity_type_name} />
        <PreviewRow
              label="Document Number"
              value={doc.identity_file_number}
            />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <span className="font-medium">Uploaded File</span>
          <span className="col-span-2 text-blue-600">
          📄 {doc.file_path
            ? getFileName(doc.file_path)
            : doc.file?.name || "No file uploaded"}
          </span>
        </div>
      </div>
    ))}
  </Section>

    {/* ================= EDUCATION DETAILS ================= */}
    <Section
      title="Education Details"
      onEdit={() => router.push(`/onboarding/${token}/education-details`)}
    >
      {educationList.map((edu, idx) => (
        <div
          key={idx}
          className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2"
        >
           <h3 className="font-semibold mb-3 capitalize">
            {edu.education_name}
          </h3>
          <PreviewRow
            label="Institute Name"
            value={edu.institution_name}
          />
          <PreviewRow
            label="Specialization"
            value={edu.specialization}
          />
          <PreviewRow
            label="Institute Location"
            value={edu. institute_location}
          />
          <PreviewRow
            label="Education Mode"
            value={edu.education_mode}
          />
          <PreviewRow
            label="Start Year"
            value={edu.start_year}
          />
          <PreviewRow
            label="Year of Passing"
            value={edu.year_of_passing}
          />
          <PreviewRow
            label="Percentage / CGPA"
            value={edu.percentage_cgpa}
          />
          <PreviewRow
            label="Delay Reason"
            value={edu.delay_reason}
          />

          {edu.documents?.map((doc, docIdx) => (
            <div key={docIdx} className="mt-3 space-y-1">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Document Name</span>
                <span className="col-span-2 text-gray-700">
                  {doc.document_name}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Uploaded File</span>
                <span className="col-span-2 text-blue-600">
                  📄 {doc.file_path ? getFileName(doc.file_path) : "No file uploaded"}
                </span>
              </div>
            </div>
          ))}

        </div>
      ))}
    </Section>

    {/* ================= EXPERIENCE DETAILS ================= */}
    <Section
      title="Experience Details"
      onEdit={() => router.push(`/onboarding/${token}/experience-details`)}
    >
      {experienceDetails.map((exp, idx) => (
        <div
          key={idx}
          className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2"
        >
          <PreviewRow label="Company Name" value={exp.company_name} />
          <PreviewRow label="Role / Designation" value={exp.role_title} />
          <PreviewRow label="Start Date" value={exp.start_date} />
          <PreviewRow label="End Date" value={exp.end_date} />
          <PreviewRow
            label="Employment Type"
            value={exp.employment_type}
          />
          <PreviewRow label="Remarks" value={exp.remarks} />

        {exp.documents?.map((doc, docIdx) => {
          const docName = doc.document_name || doc.doc_type;
          const fileName = doc.file_path
            ? getFileName(doc.file_path)
            : doc.file?.name || "No file uploaded";

          return (
            <div key={docIdx} className="mt-3 space-y-1">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Document Name</span>
                <span className="col-span-2 text-gray-700">
                  {docName || "-"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Uploaded File</span>
                <span className="col-span-2 text-blue-600">
                  📄 {fileName}
                </span>
              </div>
            </div>
          );
        })}

        </div>
      ))}
    </Section>

    {/* ================= CONFIRM ================= */}
    <div className="border rounded-md p-4 bg-white">
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

    {/* ================= SUBMIT ================= */}
    <div className="flex justify-end">
      <button
        disabled={isSubmitDisabled}
        onClick={handleSubmit}
        className={`px-6 py-2 rounded text-white ${
          isSubmitDisabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Submitting..." : "Submit Onboarding"}
      </button>
    </div>
  </div>
);
};



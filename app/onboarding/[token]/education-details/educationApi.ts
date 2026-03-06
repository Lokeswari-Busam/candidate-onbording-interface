import type { DegreeMaster, EducationLevel, MappingRow, UploadedDoc } from "./types";

export const fetchUserUuid = async (base: string, token: string) => {
  const res = await fetch(`${base}/token-verification/${token}`);
  return res.json() as Promise<string>;
};

export const fetchEducationMapping = async (
  base: string,
  countryUuid: string,
) => {
  const res = await fetch(`${base}/education/country-mapping/${countryUuid}`);
  const data = await res.json();
  return Array.isArray(data) ? (data as MappingRow[]) : [];
};

export const fetchEducationLevel = async (base: string) => {
  // We need to use process.env.NEXT_PUBLIC_API_BASE_URL because /masters might not be prefixed with the same base as token endpoints in some cases,
  // but looking at other masters endpoints in the app, `base` is used if it represents NEXT_PUBLIC_API_BASE_URL. 
  // Let's use `${base}/masters/education-level` to be consistent with how base is passed in.
  const res = await fetch(`${base}/masters/education-level`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error("Failed to load education levels");
  }
  const data = await res.json();
  const value = data.value || data; // Handle paginated or direct array response
  return Array.isArray(value) ? (value as EducationLevel[]) : [];
};

export const fetchDegreeMaster = async (base: string, education_uuid: string) => {
  const res = await fetch(`${base}/education/degree-master/${education_uuid}`);

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to load degree master data for ${education_uuid}`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) return [];

  // ✅ remove duplicate degrees
  const uniqueDegrees = Array.from(
    new Map(data.map((d: DegreeMaster) => [d.degree_uuid, d])).values()
  );

  return uniqueDegrees as DegreeMaster[];
};

export const createEducationDocument = async (
  base: string,
  payload: FormData,
) => {
  const res = await fetch(`${base}/education/employee-education-document`, {
    method: "POST",
    body: payload,
  });

  if (!res.ok) throw new Error("Create failed");

  return res.json() as Promise<UploadedDoc>;
};

export const updateEducationDocument = async (
  base: string,
  document_uuid: string,
  payload: FormData,
) => {
  const res = await fetch(
    `${base}/education/employee-education-document/${document_uuid}`,
    { method: "PUT", body: payload },
  );

  if (!res.ok) throw new Error("Update failed");

  return res.json() as Promise<UploadedDoc>;
};

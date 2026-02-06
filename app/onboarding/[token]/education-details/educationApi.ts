import type { MappingRow, UploadedDoc } from "./types";

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

export const fetchUploadedDocs = async (base: string, token: string) => {
  const res = await fetch(
    `${base}/education/employee-education-document?token=${token}`,
  );
  const data = await res.json();
  return Array.isArray(data) ? (data as UploadedDoc[]) : [];
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

import type { CommonForm, Education, MappingRow, UploadedDoc } from "./types";

export const groupRows = (rows: MappingRow[]) => {
  const map: Record<string, MappingRow[]> = {};
  rows.forEach((row) => {
    if (!map[row.education_name]) map[row.education_name] = [];
    map[row.education_name].push(row);
  });
  return map;
};

export const hasEducationChanged = (
  oldDoc: UploadedDoc,
  form: CommonForm,
  newFile?: File | null,
) => {
  if (newFile) return true;

  return (
    oldDoc.institution_name !== form.institution_name ||
    oldDoc.specialization !== form.specialization ||
    String(oldDoc.year_of_passing) !== form.year_of_passing ||
    String(oldDoc.percentage_cgpa) !== form.percentage_cgpa
  );
};

export const isEmptyValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return value === 0;
  return String(value).trim() === "" || String(value).trim() === "0";
};

const normalizeToString = (value?: string | number | null) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value === 0 ? "" : String(value);
  return String(value);
};

export const normalizeDraft = (draft: Education): Education => {
  return {
    education_name: draft.education_name,
    institution_name: normalizeToString(draft.institution_name),
    specialization: normalizeToString(draft.specialization),
    year_of_passing: normalizeToString(draft.year_of_passing),
    percentage_cgpa: normalizeToString(draft.percentage_cgpa),
    documents: Array.isArray(draft.documents) ? draft.documents : [],
  };
};

export const buildBackendDraftByLevel = (
  rows: MappingRow[],
  uploadedMap: Record<string, UploadedDoc>,
) => {
  const grouped = groupRows(rows);
  const result: Record<string, Education> = {};

  Object.entries(grouped).forEach(([level, levelRows]) => {
    const docs = levelRows
      .map((row) => {
        const uploaded = uploadedMap[row.mapping_uuid];
        return {
          document_name: row.document_name,
          file_path: uploaded?.file_path,
        };
      })
      .filter(Boolean);

    const firstDoc = levelRows
      .map((row) => uploadedMap[row.mapping_uuid])
      .find(Boolean);

    result[level] = normalizeDraft({
      education_name: level,
      institution_name: normalizeToString(firstDoc?.institution_name),
      specialization: normalizeToString(firstDoc?.specialization),
      year_of_passing: normalizeToString(firstDoc?.year_of_passing),
      percentage_cgpa: normalizeToString(firstDoc?.percentage_cgpa),
      documents: docs,
    });
  });

  return result;
};

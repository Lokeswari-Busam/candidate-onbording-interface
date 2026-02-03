"use client";

import type { CommonForm, MappingRow, UploadedDoc } from "./types";

type EducationModalProps = {
  activeLevel: string | null;
  form: CommonForm;
  activeRows: MappingRow[];
  files: Record<string, File | null>;
  uploadedMap: Record<string, UploadedDoc>;
  error: string;
  loading: boolean;
  onFormChange: (patch: Partial<CommonForm>) => void;
  onFileChange: (mappingUuid: string, file: File) => void;
  onCancel: () => void;
  onSave: () => void;
};

export default function EducationModal({
  activeLevel,
  form,
  activeRows,
  files,
  uploadedMap,
  error,
  loading,
  onFormChange,
  onFileChange,
  onCancel,
  onSave,
}: EducationModalProps) {
  if (!activeLevel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-6 text-lg font-semibold">{activeLevel} – Details</h3>

        <div className="mb-6 space-y-3">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Institute Name"
            value={form.institution_name}
            onChange={(e) => onFormChange({ institution_name: e.target.value })}
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Specialization"
            value={form.specialization}
            onChange={(e) => onFormChange({ specialization: e.target.value })}
          />
          <input
            type="number"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Year of Passing"
            value={form.year_of_passing}
            onChange={(e) => onFormChange({ year_of_passing: e.target.value })}
          />
          <input
            type="number"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Percentage / CGPA"
            value={form.percentage_cgpa}
            onChange={(e) => onFormChange({ percentage_cgpa: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          {activeRows.map((row) => {
            const existingFile = files[row.mapping_uuid];
            const uploadedDoc = uploadedMap[row.mapping_uuid];
            const uploadedName = uploadedDoc?.file_path?.split("/").pop();

            return (
              <div key={row.mapping_uuid}>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {row.document_name}
                  {row.is_mandatory && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>

                <div className="flex items-center gap-3 rounded-md border border-slate-300 px-3 py-2">
                  <label className="cursor-pointer rounded border border-slate-400 bg-white px-3 py-1 text-sm">
                    Choose File
                    <input
                      type="file"
                      hidden
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        if (file) {
                          onFileChange(row.mapping_uuid, file);
                        }
                      }}
                    />
                  </label>

                  <span className="text-sm text-slate-600">
                    {existingFile
                      ? existingFile.name
                      : uploadedName
                        ? `Current file: ${uploadedName}`
                        : "No file chosen"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md bg-slate-200 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

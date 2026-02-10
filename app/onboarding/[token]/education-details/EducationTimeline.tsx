"use client";

import { isEmptyValue } from "./educationUtils";
import type { Education, MappingRow, UploadedDoc } from "./types";

type EducationTimelineProps = {
  grouped: Record<string, MappingRow[]>;
  uploadedMap: Record<string, UploadedDoc>;
  draftByLevel: Record<string, Education>;
  onOpenLevel: (level: string) => void;
};

export default function EducationTimeline({
  grouped,
  uploadedMap,
  draftByLevel,
  onOpenLevel,
}: EducationTimelineProps) {
  return (
    <>
      {Object.entries(grouped).map(([level, rows], index) => {
        const draft = draftByLevel[level];
        const uploadedDocs = rows
          .map((r) => uploadedMap[r.mapping_uuid])
          .filter(Boolean);

        // ✅ Check if common fields are filled in localStorage
        const commonFilledInStorage = draft
          ? !isEmptyValue(draft.institution_name) &&
            !isEmptyValue(draft.specialization) &&
            !isEmptyValue(draft.year_of_passing) &&
            !isEmptyValue(draft.percentage_cgpa)
          : false;

        // ✅ Check if all required documents are uploaded to backend
        const requiredDocsComplete = rows.every(
          (row) => !row.is_mandatory || uploadedMap[row.mapping_uuid],
        );

        // ✅ Show expanded details if form is filled in localStorage (regardless of docs)
        const showExpandedDetails = commonFilledInStorage;

        // ✅ Mark as completed only if both form AND docs are done
        const completed = commonFilledInStorage && requiredDocsComplete;

        const anyFieldFilled = draft
          ? !isEmptyValue(draft.institution_name) ||
            !isEmptyValue(draft.specialization) ||
            !isEmptyValue(draft.year_of_passing) ||
            !isEmptyValue(draft.percentage_cgpa)
          : false;

        const anyDocsUploaded = uploadedDocs.length > 0;

        const inProgress = (anyFieldFilled || anyDocsUploaded) && !completed;

        const prevRows: MappingRow[] =
          index === 0 ? [] : (grouped[Object.keys(grouped)[index - 1]] ?? []);

        const isUnlocked =
          index === 0 ||
          prevRows.every((row) => uploadedMap[row.mapping_uuid]);

        return (
          <div key={level} className="flex gap-6 mb-8">
            {/* LEFT VERTICAL BAR */}
            <div className="flex flex-col items-center">
              <div
                className={`h-4 w-4 rounded-full ${
                  completed
                    ? "bg-green-500"
                    : showExpandedDetails
                      ? "bg-yellow-500"
                      : inProgress
                        ? "bg-blue-500"
                        : "bg-gray-300"
                }`}
              />
              {index !== Object.keys(grouped).length - 1 && (
                <div
                  className={`w-0.5 flex-1 ${
                    completed ? "bg-green-500" : showExpandedDetails ? "bg-yellow-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold capitalize">{level}</h3>
                  <p className="text-sm text-gray-500">
                    {completed
                      ? "Completed"
                      : showExpandedDetails
                        ? "Form filled - Documents pending"
                        : inProgress
                          ? "In progress"
                          : "Not started"}
                  </p>
                </div>

                <button
                  disabled={!isUnlocked}
                  onClick={() => onOpenLevel(level)}
                  className={`rounded-md px-4 py-1.5 text-sm text-white ${
                    isUnlocked
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {completed ? "Edit" : "+ Add Details"}
                </button>
              </div>

              {/* EXPANDABLE SUMMARY */}
              {showExpandedDetails && (
                <div className="mt-4 rounded-md border bg-gray-50 p-5 space-y-4">
                  {/* COMMON DETAILS */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Institute Name</p>
                      <p className="font-medium">
                        {draft?.institution_name ||
                          uploadedDocs[0]?.institution_name ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Specialization</p>
                      <p className="font-medium">
                        {draft?.specialization ||
                          uploadedDocs[0]?.specialization ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Year of Passing</p>
                      <p className="font-medium">
                        {draft?.year_of_passing ||
                          uploadedDocs[0]?.year_of_passing ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Percentage / CGPA</p>
                      <p className="font-medium">
                        {draft?.percentage_cgpa ||
                          uploadedDocs[0]?.percentage_cgpa ||
                          "-"}
                      </p>
                    </div>
                  </div>

                  {/* DOCUMENTS */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">Documents:</p>
                    {rows.map((row) => {
                      const doc = uploadedMap[row.mapping_uuid];

                      return (
                        <div
                          key={row.mapping_uuid}
                          className="rounded-md border bg-white p-3"
                        >
                          <p className="text-sm font-medium">
                            {row.document_name}
                            {row.is_mandatory && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </p>

                          {doc ? (
                            <p className="text-sm text-blue-600 mt-1">
                              📄 {doc.file_path?.split("/").pop()}
                            </p>
                          ) : (
                            <p className="text-sm text-orange-600 mt-1">
                              ⏳ Pending upload
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

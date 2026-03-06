"use client";

import { useState, useRef, useEffect } from "react";
import { isEmptyValue } from "./educationUtils";
import type { DegreeMaster, Education, MappingRow, UploadedDoc } from "./types";

type EducationTimelineProps = {
  grouped: Record<string, MappingRow[]>;
  uploadedMap: Record<string, UploadedDoc>;
  draftByLevel: Record<string, Education>;
  degrees: DegreeMaster[];
  onOpenLevel: (level: string) => void;
};

export default function EducationTimeline({
  grouped,
  uploadedMap,
  draftByLevel,
  degrees,
  onOpenLevel,
}: EducationTimelineProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addedLevels = Object.entries(grouped).filter(([level, rows]) => {
    const draft = draftByLevel[level];
    const uploadedDocs = rows
      .map((r) => uploadedMap[r.mapping_uuid])
      .filter(Boolean);

    const anyFieldFilled = draft
      ? !isEmptyValue(draft.institution_name) ||
        !isEmptyValue(draft.specialization) ||
        !isEmptyValue(draft.year_of_passing) ||
        !isEmptyValue(draft.percentage_cgpa)
      : false;

    // A level is added if it has form data or uploaded documents
    return draft || uploadedDocs.length > 0 || anyFieldFilled;
  });

  const availableLevels = Object.keys(grouped).filter(
    (level) => !addedLevels.find(([l]) => l === level)
  );

  return (
    <div className="pb-16">
      {addedLevels.map(([level, rows], arrayIndex) => {
        const draft = draftByLevel[level];
        const uploadedDocs = rows
          .map((r) => uploadedMap[r.mapping_uuid])
          .filter(Boolean);

        // ✅ Check if common fields are filled in localStorage
        const commonFilledInStorage = draft
          ? !isEmptyValue(draft.institution_name) &&
            !isEmptyValue(draft.specialization) &&
            !isEmptyValue(draft.year_of_passing) &&
            !isEmptyValue(draft.percentage_cgpa) &&
            !isEmptyValue(draft.degree_uuid) &&
            !isEmptyValue(draft.institute_location) &&
            !isEmptyValue(draft.education_mode) &&
            !isEmptyValue(draft.start_year)
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

        // Find the index of this level in the original grouped sequence
        const originalKeys = Object.keys(grouped);
        const originalIndex = originalKeys.indexOf(level);
        
        const prevRows: MappingRow[] =
          originalIndex === 0 ? [] : (grouped[originalKeys[originalIndex - 1]] ?? []);

        const isUnlocked =
          originalIndex === 0 ||
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
              {/* Draw a line connecting nodes. If there's an add button below or it's not the last added item, draw the line. */}
              {(arrayIndex !== addedLevels.length - 1 || availableLevels.length > 0) && (
                <div
                  className={`w-0.5 flex-1 ${
                    completed ? "bg-green-500" : showExpandedDetails ? "bg-yellow-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex-1 pb-4">
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
                  className={`rounded-md px-4 py-1.5 text-sm white text-white ${
                    isUnlocked
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {completed ? "Edit" : "Edit Details"}
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
                      <p className="text-gray-500">Degree</p>
                      <p className="font-medium">
                        {(() => {
                          const uuid = draft?.degree_uuid || uploadedDocs[0]?.degree_uuid;
                          if (!uuid) return "-";
                          const degree = degrees.find((d) => d.degree_uuid === uuid);
                          return degree ? degree.degree_name : uuid;
                        })()}
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
                      <p className="text-gray-500">Institute Location</p>
                      <p className="font-medium">
                        {draft?.institute_location ||
                          uploadedDocs[0]?.institute_location ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Start Year</p>
                      <p className="font-medium">
                        {draft?.start_year ||
                          uploadedDocs[0]?.start_year ||
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

                    <div>
                      <p className="text-gray-500">Education Mode</p>
                      <p className="font-medium">
                        {draft?.education_mode ||
                          uploadedDocs[0]?.education_mode ||
                          "-"}
                      </p>
                    </div>

                    {(draft?.delay_reason || uploadedDocs[0]?.delay_reason) && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Delay Reason</p>
                        <p className="font-medium">
                          {draft?.delay_reason || uploadedDocs[0]?.delay_reason}
                        </p>
                      </div>
                    )}
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

      {/* Add Education Dropdown Flow */}
      {availableLevels.length > 0 && (
        <div className="flex gap-6 relative">
          {/* Vertical alignment placeholder to match the timeline dots above */}
          <div className="flex flex-col items-center">
            <div className="h-4 w-4 rounded-full bg-gray-300" />
            <div className="w-0.5 flex-1 bg-gray-300" />
          </div>
          <div className="flex-1 pb-4">
            <div className="relative inline-block text-left" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="rounded-md px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none"
              >
                + Add Education
              </button>
              
              {showDropdown && (
                <div className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    {availableLevels.map((level) => (
                      <button
                        key={level}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 capitalize"
                        role="menuitem"
                        onClick={() => {
                          setShowDropdown(false);
                          onOpenLevel(level);
                        }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

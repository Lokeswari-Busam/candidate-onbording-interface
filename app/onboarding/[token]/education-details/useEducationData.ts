"use client";

import { useEffect, useState } from "react";
import type { MappingRow, UploadedDoc } from "./types";
import {
  fetchEducationMapping,
  fetchUserUuid,
} from "./educationApi";

type UseEducationDataArgs = {
  base: string;
  token?: string;
  countryUuid: string;
  onError: (message: string) => void;
};

export const useEducationData = ({
  base,
  token,
  countryUuid,
  onError,
}: UseEducationDataArgs) => {
  const [rows, setRows] = useState<MappingRow[]>([]);
  const [uploadedMap, setUploadedMap] = useState<Record<string, UploadedDoc>>(
    {},
  );
  const [userUuid, setUserUuid] = useState("");

  useEffect(() => {
    if (!token) return;

    fetchUserUuid(base, token)
      .then((uuid) => setUserUuid(uuid))
      .catch(() => onError("Invalid onboarding link"));
  }, [base, token, onError]);

  useEffect(() => {
    if (!countryUuid) return; // Skip if countryUuid is not loaded

    fetchEducationMapping(base, countryUuid)
      .then((data) => {
        setRows(data);
      })
      .catch(() => onError("Failed to load education mapping"));
  }, [base, countryUuid, onError]);

  return {
    rows,
    uploadedMap,
    setUploadedMap,
    userUuid,
  };
};

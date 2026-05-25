import { useCallback, useState } from "react";

import {
  observedProfileStorageKey,
  type ObservedProfileState,
} from "../content/profileContent";

const fallbackObservedProfileState: ObservedProfileState = {
  githubBio: "",
  githubLocation: "",
  linkedinHeadline: "",
  linkedinLocation: "",
  linkedinCompany: "",
};

function readObservedProfileState() {
  const raw = localStorage.getItem(observedProfileStorageKey);
  if (!raw) {
    return fallbackObservedProfileState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ObservedProfileState>;
    return {
      ...fallbackObservedProfileState,
      ...parsed,
    };
  } catch {
    return fallbackObservedProfileState;
  }
}

export function useObservedProfileState() {
  const [observed, setObserved] = useState<ObservedProfileState>(() =>
    readObservedProfileState(),
  );

  const updateObserved = useCallback(
    (field: keyof ObservedProfileState, value: string) => {
      setObserved((previous) => {
        const next = {
          ...previous,
          [field]: value,
        };
        localStorage.setItem(observedProfileStorageKey, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const clearObservedSnapshot = useCallback(() => {
    localStorage.removeItem(observedProfileStorageKey);
    setObserved(fallbackObservedProfileState);
  }, []);

  return {
    observed,
    updateObserved,
    clearObservedSnapshot,
  };
}

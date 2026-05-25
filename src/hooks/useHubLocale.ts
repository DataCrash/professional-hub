import { useCallback, useState } from "react";

import { localeStorageKey, type Locale } from "../content/profileContent";

export function useHubLocale() {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem(localeStorageKey);
    return stored === "en" ? "en" : "pt-BR";
  });

  const handleLocaleChange = useCallback((value: Locale) => {
    setLocale(value);
    localStorage.setItem(localeStorageKey, value);
  }, []);

  return {
    locale,
    handleLocaleChange,
  };
}

import { useCallback, useState } from "react";

import {
  getAnalyticsSummary,
  getClickBreakdown,
  getRecentAnalyticsEvents,
} from "../lib/analytics";
import {
  clearLocalTrackingData,
  getStoredConsentDetails,
  getStoredConsentMode,
  saveConsent,
  type ConsentMode,
} from "../lib/consent";

type ConsentDetails = {
  analytics: boolean;
  traffic: boolean;
};

export function usePrivacyPanel() {
  const [mode, setMode] = useState<ConsentMode>(() => getStoredConsentMode());
  const [analytics, setAnalytics] = useState(
    () => getStoredConsentDetails().analytics,
  );
  const [traffic, setTraffic] = useState(
    () => getStoredConsentDetails().traffic,
  );
  const [summary, setSummary] = useState(() => getAnalyticsSummary());

  const applyConsent = useCallback(
    (nextMode: ConsentMode, details: ConsentDetails) => {
      if (nextMode === "unset") {
        return;
      }

      saveConsent(nextMode, details);
      setMode(nextMode);
      setAnalytics(details.analytics);
      setTraffic(details.traffic);
      setSummary(getAnalyticsSummary());
    },
    [],
  );

  const acceptAll = useCallback(() => {
    applyConsent("accepted", { analytics: true, traffic: true });
  }, [applyConsent]);

  const rejectAll = useCallback(() => {
    applyConsent("rejected", { analytics: false, traffic: false });
  }, [applyConsent]);

  const customize = useCallback(() => {
    applyConsent("custom", { analytics: true, traffic: false });
  }, [applyConsent]);

  const clearLocalData = useCallback(() => {
    clearLocalTrackingData();
    setMode("unset");
    setAnalytics(false);
    setTraffic(false);
    setSummary(getAnalyticsSummary());
  }, []);

  const refreshAnalyticsPanel = useCallback(() => {
    setSummary(getAnalyticsSummary());
  }, []);

  return {
    mode,
    analytics,
    traffic,
    summary,
    recentEvents: getRecentAnalyticsEvents(),
    clickBreakdown: getClickBreakdown(),
    acceptAll,
    rejectAll,
    customize,
    clearLocalData,
    refreshAnalyticsPanel,
  };
}

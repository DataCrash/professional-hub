import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { captureTrafficSource, trackPageView } from "../../lib/analytics";

export function RouteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    trackPageView(path);
    captureTrafficSource(path);
  }, [location.pathname, location.search]);

  return null;
}

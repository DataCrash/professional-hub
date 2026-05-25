import { useCallback } from "react";
import { BrowserRouter } from "react-router-dom";

import { HubLayout } from "./components/shell/HubLayout";
import { RouteAnalyticsTracker } from "./components/shell/RouteAnalyticsTracker";
import { baseUrl, type TrackClickHandler } from "./content/profileContent";
import { useHubLocale } from "./hooks/useHubLocale";
import { trackClick } from "./lib/analytics";
import { HubRoutes } from "./routes/HubRoutes";

function App() {
  const { locale, handleLocaleChange } = useHubLocale();

  const handleTrackClick: TrackClickHandler = useCallback((path, label) => {
    trackClick(path, label);
  }, []);

  return (
    <BrowserRouter basename={baseUrl}>
      <RouteAnalyticsTracker />
      <HubLayout
        locale={locale}
        onLocaleChange={handleLocaleChange}
        onTrackClick={handleTrackClick}
      >
        <HubRoutes locale={locale} onTrackClick={handleTrackClick} />
      </HubLayout>
    </BrowserRouter>
  );
}

export default App;

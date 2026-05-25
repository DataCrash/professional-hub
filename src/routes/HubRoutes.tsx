import { Navigate, Route, Routes } from "react-router-dom";

import type { Locale, TrackClickHandler } from "../content/profileContent";
import { CvEn } from "../pages/CvEn";
import { CvPtBr } from "../pages/CvPtBr";
import { Dashboard } from "../pages/Dashboard";
import { Frontpage } from "../pages/Frontpage";
import { OwnerAccessGate } from "../pages/OwnerAccessGate";
import { Privacy } from "../pages/Privacy";
import { SyncKit } from "../pages/SyncKit";

export function HubRoutes({
  locale,
  onTrackClick,
}: Readonly<{
  locale: Locale;
  onTrackClick: TrackClickHandler;
}>) {
  return (
    <Routes>
      <Route
        path="/"
        element={<Frontpage locale={locale} onTrackClick={onTrackClick} />}
      />
      <Route
        path="/dashboard"
        element={<Dashboard locale={locale} onTrackClick={onTrackClick} />}
      />
      <Route path="/cv-ptbr" element={<CvPtBr onTrackClick={onTrackClick} />} />
      <Route path="/cv-en" element={<CvEn onTrackClick={onTrackClick} />} />
      <Route
        path="/sync-kit"
        element={
          <OwnerAccessGate locale={locale}>
            <SyncKit locale={locale} onTrackClick={onTrackClick} />
          </OwnerAccessGate>
        }
      />
      <Route path="/privacidade" element={<Privacy locale={locale} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

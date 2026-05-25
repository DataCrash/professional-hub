import { useState } from "react";

import {
  getStoredConsentMode,
  saveConsent,
  type ConsentMode,
} from "../../lib/consent";
import { Button } from "../ui/button";

export function ConsentBanner() {
  const [mode, setMode] = useState<ConsentMode>(() => getStoredConsentMode());

  if (mode !== "unset") {
    return null;
  }

  return (
    <div className="consent-banner sticky bottom-3 z-20 mt-4 rounded-2xl border p-4 shadow-xl">
      <p className="text-sm text-muted-foreground">
        Coletamos dados anônimos para experiência básica. Com seu consentimento,
        registramos eventos detalhados e origem de tráfego.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            saveConsent("accepted", { analytics: true, traffic: true });
            setMode("accepted");
          }}
        >
          Aceitar tudo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            saveConsent("rejected", { analytics: false, traffic: false });
            setMode("rejected");
          }}
        >
          Recusar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            saveConsent("custom", { analytics: true, traffic: false });
            setMode("custom");
          }}
        >
          Personalizar
        </Button>
      </div>
    </div>
  );
}

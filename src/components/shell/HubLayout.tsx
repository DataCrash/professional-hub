import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";

import {
  localizedNavigation,
  ownerAccessStorageKey,
  profile,
  type Locale,
  type TrackClickHandler,
} from "../../content/profileContent";
import { useWaterMotion } from "../../hooks/useWaterMotion";
import { ScrollReveal } from "../common/ScrollReveal";
import { Button } from "../ui/button";
import { ConsentBanner } from "./ConsentBanner";

type HubLayoutProps = {
  children: ReactNode;
  locale: Locale;
  onLocaleChange: (value: Locale) => void;
  onTrackClick: TrackClickHandler;
};

export function HubLayout({
  children,
  locale,
  onLocaleChange,
  onTrackClick,
}: Readonly<HubLayoutProps>) {
  const [isOwner, setIsOwner] = useState(
    () => localStorage.getItem(ownerAccessStorageKey) === "true",
  );
  const {
    handlePointerDown,
    handlePointerLeave,
    handlePointerMove,
    setRippleRef,
  } = useWaterMotion();

  useEffect(() => {
    const syncOwnerAccess = () => {
      setIsOwner(localStorage.getItem(ownerAccessStorageKey) === "true");
    };

    syncOwnerAccess();
    globalThis.addEventListener("hub-owner-access-changed", syncOwnerAccess);

    return () => {
      globalThis.removeEventListener(
        "hub-owner-access-changed",
        syncOwnerAccess,
      );
    };
  }, []);

  const navigation = useMemo(() => {
    const items = [...localizedNavigation[locale]];
    if (isOwner) {
      items.splice(4, 0, { to: "/sync-kit", label: "Sync Kit" });
    }
    return items;
  }, [isOwner, locale]);

  return (
    <div
      className="hub-shell mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8"
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      <div className="hub-atmosphere" aria-hidden="true">
        <div className="signal-field" />
        <div className="hub-atmosphere-blob3" />
        <span ref={setRippleRef(0)} className="water-ripple water-ripple-a" />
        <span ref={setRippleRef(1)} className="water-ripple water-ripple-b" />
      </div>
      <header className="hub-header animate-fade-in rounded-3xl border p-4 backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Datacrash Professional Hub
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">
              Professional Profile Platform
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "pt-BR"
                ? "Narrativa técnica clara para decisão de contratação"
                : "Clear technical narrative for hiring decisions"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:flex-nowrap">
            <Button asChild variant="outline" size="sm">
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  onTrackClick("/header", "github");
                }}
              >
                GitHub <ArrowUpRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="sm">
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  onTrackClick("/header", "linkedin");
                }}
              >
                LinkedIn <ArrowUpRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {locale === "pt-BR" ? "Idioma" : "Language"}
          </span>
          <Button
            variant={locale === "pt-BR" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              onLocaleChange("pt-BR");
            }}
          >
            PT-BR
          </Button>
          <Button
            variant={locale === "en" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              onLocaleChange("en");
            }}
          >
            EN
          </Button>
        </div>
        <nav className="hub-nav-shell mt-4">
          <div className="hub-nav flex gap-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  onTrackClick("/nav", item.label.toLowerCase());
                }}
                className={({ isActive }) =>
                  [
                    "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-300",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_12px_28px_-18px_hsl(var(--primary))]"
                      : "border-border/80 bg-background/70 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-secondary",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main className="hub-main py-6">
        <ScrollReveal>{children}</ScrollReveal>
      </main>
      <ConsentBanner />
    </div>
  );
}

import { Gauge, LayoutDashboard, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";

import { PageCard } from "../components/common/PageCard";
import { Button } from "../components/ui/button";
import type { Locale, TrackClickHandler } from "../content/profileContent";
import { getFrontpageText } from "./frontpageText";

export function Frontpage({
  locale,
  onTrackClick,
}: Readonly<{
  locale: Locale;
  onTrackClick: TrackClickHandler;
}>) {
  const text = getFrontpageText(locale);

  return (
    <section className="reveal-stagger grid gap-4 md:grid-cols-2">
      <article className="hero-panel animate-fade-in rounded-3xl border p-6 shadow-sm md:col-span-2 md:p-8">
        <div className="hero-grid grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="signal-chip inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                {text.chip}
              </span>
            </div>
            <h2 className="text-gradient-primary mt-4 max-w-4xl text-3xl leading-tight md:text-6xl">
              {text.title}
            </h2>
            <p className="mt-5 max-w-3xl text-muted-foreground md:text-lg">
              {text.body}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild>
                <NavLink
                  to="/dashboard"
                  onClick={() => {
                    onTrackClick("/", "cta-dashboard");
                  }}
                  className="w-full text-center sm:w-auto"
                >
                  {text.ctaDashboard}
                </NavLink>
              </Button>
              <Button asChild variant="outline" className="bg-background/70">
                <NavLink
                  to="/cv-ptbr"
                  onClick={() => {
                    onTrackClick("/", "cta-cv-ptbr");
                  }}
                  className="w-full text-center sm:w-auto"
                >
                  {text.ctaCvPt}
                </NavLink>
              </Button>
              <Button asChild variant="outline" className="bg-background/70">
                <NavLink
                  to="/cv-en"
                  onClick={() => {
                    onTrackClick("/", "cta-cv-en");
                  }}
                  className="w-full text-center sm:w-auto"
                >
                  {text.ctaCvEn}
                </NavLink>
              </Button>
            </div>
          </div>

          <aside className="hero-aside rounded-2xl border border-border/80 bg-background/55 p-4 md:col-span-4 md:p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {text.readiness}
            </p>
            <h3 className="mt-2 text-lg font-semibold">
              {text.readinessTitle}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="rounded-lg border border-border/70 bg-background/75 px-3 py-2">
                {text.item1}
              </li>
              <li className="rounded-lg border border-border/70 bg-background/75 px-3 py-2">
                {text.item2}
              </li>
              <li className="rounded-lg border border-border/70 bg-background/75 px-3 py-2">
                {text.item3}
              </li>
            </ul>
            <div className="kpi-grid mt-4 grid grid-cols-3 gap-2">
              <div className="kpi-card rounded-xl border border-border/80 bg-background/80 p-2 text-center">
                <p className="text-lg font-semibold kpi-value">15+</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {text.years}
                </p>
              </div>
              <div className="kpi-card rounded-xl border border-border/80 bg-background/80 p-2 text-center">
                <p className="text-lg font-semibold kpi-value">.NET</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Core
                </p>
              </div>
              <div className="kpi-card rounded-xl border border-border/80 bg-background/80 p-2 text-center">
                <p className="text-lg font-semibold kpi-value">Hub</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Live
                </p>
              </div>
            </div>
          </aside>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1">
            GitHub {"->"} Frontpage {"->"} Dashboard {"->"} CV
          </span>
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1">
            {text.decisionFlow}
          </span>
        </div>
      </article>
      <div data-reveal data-delay="1">
        <PageCard
          title={text.card1Title}
          description={text.card1Desc}
          icon={<Gauge className="h-5 w-5" />}
        />
      </div>
      <div data-reveal data-delay="2">
        <PageCard
          title={text.card2Title}
          description={text.card2Desc}
          icon={<LayoutDashboard className="h-5 w-5" />}
        />
      </div>

      <article
        data-reveal
        data-delay="3"
        className="evidence-strip rounded-3xl border p-6 md:col-span-2"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.why}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <h3 className="text-sm font-semibold">{text.why1Title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {text.why1Desc}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <h3 className="text-sm font-semibold">{text.why2Title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {text.why2Desc}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <h3 className="text-sm font-semibold">{text.why3Title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {text.why3Desc}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

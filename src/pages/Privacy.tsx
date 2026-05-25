import { ChartNoAxesCombined, ShieldCheck } from "lucide-react";

import { Button } from "../components/ui/button";
import { type Locale } from "../content/profileContent";
import { getPrivacyText } from "./privacyText";
import { usePrivacyPanel } from "./usePrivacyPanel";

export function Privacy({ locale }: Readonly<{ locale: Locale }>) {
  const {
    mode,
    analytics,
    traffic,
    summary,
    recentEvents,
    clickBreakdown,
    acceptAll,
    rejectAll,
    customize,
    clearLocalData,
    refreshAnalyticsPanel,
  } = usePrivacyPanel();
  const emptyEvents = [{ type: "page_view", path: "-", ts: "-", label: "-" }];
  const text = getPrivacyText(locale);

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 inline-flex rounded-xl border border-border bg-background p-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="text-2xl">{text.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{text.intro}</p>
        <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-4 text-sm">
          <p>
            <strong>{text.profileData}:</strong> nome, headline, links e
            métricas de repositórios.
          </p>
          <p className="mt-1">
            <strong>{text.visitorData}:</strong> page views, cliques e origem de
            tráfego, conforme consentimento.
          </p>
          <p>
            <strong>{text.consentState}:</strong> {mode}
          </p>
          <p className="mt-1">
            {text.analyticsDetailed}: {analytics ? text.active : text.disabled}
          </p>
          <p>
            {text.trafficSource}: {traffic ? text.active : text.disabled}
          </p>
          <p className="mt-2">
            {text.localEvents}: {summary.totalEvents}
          </p>
          <p>
            {text.localPageViews}: {summary.pageViews}
          </p>
          <p>
            {text.trackedClicks}: {summary.clicks}
          </p>
          <p className="mt-2">
            {text.initialSource}:{" "}
            {summary.trafficSource
              ? `${summary.trafficSource.referrer} (${summary.trafficSource.utmSource})`
              : text.notCaptured}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {text.noAutoIdentification}
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.controls}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={acceptAll}>
            {text.acceptAll}
          </Button>
          <Button variant="outline" size="sm" onClick={rejectAll}>
            {text.reject}
          </Button>
          <Button variant="outline" size="sm" onClick={customize}>
            {text.customize}
          </Button>
        </div>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={clearLocalData}>
            {text.deleteLocalData}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={refreshAnalyticsPanel}
          >
            {text.refreshPanel}
          </Button>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {text.localInspection}
            </p>
            <h3 className="mt-2 text-xl font-semibold">{text.browserEvents}</h3>
          </div>
          <ChartNoAxesCombined className="h-5 w-5 text-primary" />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">{text.topClicks}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(clickBreakdown.length
                ? clickBreakdown
                : [{ label: text.noClicks, count: 0 }]
              ).map((item) => (
                <li
                  key={item.label}
                  className="rounded-lg border border-border/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="font-semibold text-primary">
                      {item.count}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">{text.recentEvents}</h4>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {(recentEvents.length ? recentEvents : emptyEvents).map(
                (event, index) => (
                  <li
                    key={`${event.ts}-${index}`}
                    className="rounded-lg border border-border/60 px-3 py-2"
                  >
                    <p className="font-medium text-foreground">
                      {event.type} · {event.label || event.path}
                    </p>
                    <p className="mt-1">{event.path}</p>
                    <p className="mt-1">{event.ts}</p>
                  </li>
                ),
              )}
            </ul>
          </section>
        </div>
      </article>
    </section>
  );
}

import { ClipboardCheck, Download, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../components/ui/button";
import {
  baseUrl,
  fitRolesEn,
  fitRolesPt,
  profile,
  profileReadmeSnippetPath,
  profileReviewTemplatePath,
  type Locale,
  type ProfileSyncPayload,
  type TrackClickHandler,
} from "../content/profileContent";
import {
  buildActionableDiffs,
  buildComparisonRows,
  buildExpectedProfileFields,
  buildReadiness,
  buildSyncKitDiagnosticMarkdown,
  getDiffStatus,
  getDiffStatusClasses,
} from "./syncKitHelpers";
import { getSyncKitText } from "./syncKitText";
import { useObservedProfileState } from "./useObservedProfileState";

export function SyncKit({
  locale,
  onTrackClick,
}: Readonly<{
  locale: Locale;
  onTrackClick: TrackClickHandler;
}>) {
  const [payload, setPayload] = useState<ProfileSyncPayload | null>(null);
  const { observed, updateObserved, clearObservedSnapshot } =
    useObservedProfileState();

  useEffect(() => {
    let isMounted = true;

    async function loadPayload() {
      try {
        const response = await fetch(
          `${baseUrl}data/profile-sync-payload.json`,
          {
            cache: "no-store",
          },
        );
        if (!response.ok) return;
        const data = (await response.json()) as ProfileSyncPayload;
        if (isMounted) {
          setPayload(data);
        }
      } catch {
        // Keep fallback UI when payload file is unavailable.
      }
    }

    void loadPayload();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadingPayloadText =
    locale === "pt-BR"
      ? "Carregando payload de sincronização..."
      : "Loading synchronization payload...";

  const githubBio = payload
    ? `${payload.headlineEn} | ${payload.location} | ${payload.currentCompany}`
    : loadingPayloadText;

  const linkedinAbout = payload
    ? "I build and modernize enterprise backend platforms with .NET, focusing on reliability, architecture quality, and measurable delivery outcomes."
    : loadingPayloadText;

  const text = getSyncKitText(locale);

  const expectedFields = useMemo(
    () => buildExpectedProfileFields(payload),
    [payload],
  );

  const comparisonRows = useMemo(
    () => buildComparisonRows(expectedFields, observed),
    [expectedFields, observed],
  );

  const readiness = useMemo(
    () => buildReadiness(comparisonRows),
    [comparisonRows],
  );

  const actionableDiffs = useMemo(
    () => buildActionableDiffs(comparisonRows),
    [comparisonRows],
  );

  const diagnosticMarkdown = useMemo(
    () =>
      buildSyncKitDiagnosticMarkdown({ payload, readiness, comparisonRows }),
    [payload, readiness, comparisonRows],
  );

  function downloadDiagnosticMarkdown() {
    const blob = new Blob([diagnosticMarkdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `sync-kit-diagnostic-${stamp}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 inline-flex rounded-xl border border-border bg-background p-2 text-primary">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.assistedIntegration}
        </p>
        <h2 className="mt-2 text-3xl">{text.syncKitTitle}</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          {text.syncKitBody}
        </p>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.payloadSnapshot}
        </p>
        {payload ? (
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>{text.name}:</strong> {payload.name}
            </p>
            <p>
              <strong>{text.location}:</strong> {payload.location}
            </p>
            <p>
              <strong>{text.company}:</strong> {payload.currentCompany}
            </p>
            <p>
              <strong>{text.checkpoint}:</strong>{" "}
              {payload.notes.humanCheckpointRequired ? text.required : text.no}
            </p>
            <p className="pt-1">
              <strong>{text.usage}:</strong> {payload.notes.usage}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {text.waitingPayload}
          </p>
        )}
      </article>

      <article className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.diffMatrix}
        </p>
        <h3 className="mt-2 text-xl font-semibold">{text.expectedObserved}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {text.expectedObservedBody}
        </p>

        <div className="mt-4 rounded-xl border border-border/70 bg-background/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{text.readinessSummary}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {readiness.evaluated} de {readiness.total}{" "}
                {text.fieldsEvaluated} ({readiness.completion}%)
              </p>
            </div>
            <span
              className={[
                "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                readiness.readyForCheckpoint
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300",
              ].join(" ")}
            >
              {readiness.readyForCheckpoint ? text.ready : text.pending}
            </span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.max(readiness.completion, 5)}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-border/70 bg-background px-2 py-0.5">
              ok: {readiness.ok}
            </span>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-300">
              divergentes: {readiness.divergent}
            </span>
            <span className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-muted-foreground">
              não avaliados: {readiness.pending}
            </span>
          </div>

          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={clearObservedSnapshot}>
              {text.clearSnapshot}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={downloadDiagnosticMarkdown}
            >
              {text.exportDiagnostic} <Download className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <h4 className="text-sm font-semibold text-amber-200">
              {text.divergentPending}
            </h4>
            {actionableDiffs.divergentRows.length ? (
              <ul className="mt-2 space-y-2 text-xs text-amber-100">
                {actionableDiffs.divergentRows.map((row) => (
                  <li
                    key={`divergent-${row.label}`}
                    className="rounded-lg border border-amber-500/30 bg-background/30 p-2"
                  >
                    <p className="font-medium">{row.label}</p>
                    <p className="mt-1">Esperado: {row.expected || "n/a"}</p>
                    <p>Observado: {row.observed || "n/a"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-amber-100/80">
                {text.noDivergence}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">
              {text.nonEvaluatedPending}
            </h4>
            {actionableDiffs.pendingRows.length ? (
              <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                {actionableDiffs.pendingRows.map((row) => (
                  <li
                    key={`pending-${row.label}`}
                    className="rounded-lg border border-border/60 bg-background/70 p-2"
                  >
                    <p className="font-medium text-foreground">{row.label}</p>
                    <p className="mt-1">Esperado: {row.expected || "n/a"}</p>
                    <p>{text.fillObserved}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {text.allEvaluated}
              </p>
            )}
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">{text.observedValues}</h4>
            <div className="mt-3 space-y-3 text-sm">
              <label className="block">
                <span className="mb-1 block text-muted-foreground">
                  GitHub Bio
                </span>
                <input
                  value={observed.githubBio}
                  onChange={(event) => {
                    updateObserved("githubBio", event.target.value);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a bio atual do GitHub"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-muted-foreground">
                  GitHub Location
                </span>
                <input
                  value={observed.githubLocation}
                  onChange={(event) => {
                    updateObserved("githubLocation", event.target.value);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a localização atual do GitHub"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-muted-foreground">
                  LinkedIn Headline
                </span>
                <input
                  value={observed.linkedinHeadline}
                  onChange={(event) => {
                    updateObserved("linkedinHeadline", event.target.value);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a headline atual do LinkedIn"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-muted-foreground">
                  LinkedIn Location
                </span>
                <input
                  value={observed.linkedinLocation}
                  onChange={(event) => {
                    updateObserved("linkedinLocation", event.target.value);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a localização atual do LinkedIn"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-muted-foreground">
                  LinkedIn Company
                </span>
                <input
                  value={observed.linkedinCompany}
                  onChange={(event) => {
                    updateObserved("linkedinCompany", event.target.value);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a empresa atual do LinkedIn"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">{text.compareResult}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {comparisonRows.map((row) => {
                const status = getDiffStatus(row.expected, row.observed);
                return (
                  <li
                    key={row.label}
                    className="rounded-lg border border-border/60 bg-background/70 p-3"
                  >
                    <p className="font-medium">{row.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {text.expected}: {row.expected || "n/a"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {text.observed}: {row.observed || "n/a"}
                    </p>
                    <span
                      className={[
                        "mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                        getDiffStatusClasses(status),
                      ].join(" ")}
                    >
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.checklist}
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
            {text.checklist1}
          </li>
          <li className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
            {text.checklist2}
          </li>
          <li className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
            {text.checklist3}
          </li>
          <li className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
            {text.checklist4}
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a
              href={profileReadmeSnippetPath}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                onTrackClick("/sync-kit", "open-readme-snippet");
              }}
            >
              {text.openReadmeSnippet}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href={profileReviewTemplatePath}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                onTrackClick("/sync-kit", "open-review-template");
              }}
            >
              {text.openReviewTemplate}
            </a>
          </Button>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.readyTexts}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-semibold">
              {text.githubBioSuggestion}
            </h3>
            <p className="mt-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
              {githubBio}
            </p>
            <a
              href={payload?.githubUrl || profile.github}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
              onClick={() => {
                onTrackClick("/sync-kit", "open-github-profile");
              }}
            >
              {text.openGithubProfile} <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </section>

          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-semibold">
              {text.linkedinAboutSuggestion}
            </h3>
            <p className="mt-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
              {linkedinAbout}
            </p>
            <a
              href={payload?.linkedinUrl || profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
              onClick={() => {
                onTrackClick("/sync-kit", "open-linkedin-profile");
              }}
            >
              {text.openLinkedinProfile}{" "}
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-semibold">{text.targetRolesPt}</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {(payload?.targetRoles.ptBr || fitRolesPt).map((role) => (
                <li key={role}>- {role}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-semibold">{text.targetRolesEn}</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {(payload?.targetRoles.en || fitRolesEn).map((role) => (
                <li key={role}>- {role}</li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </section>
  );
}

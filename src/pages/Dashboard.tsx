import {
  Activity,
  BarChart3,
  Briefcase,
  ChartNoAxesCombined,
  Download,
  ExternalLink,
  MapPin,
  PieChart,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";

import { GlowCard } from "../components/common/GlowCard";
import { Button } from "../components/ui/button";
import {
  profile,
  pulseMessagesEn,
  pulseMessagesPt,
  type Locale,
  type TrackClickHandler,
} from "../content/profileContent";
import { useGithubMetrics } from "../hooks/useGithubMetrics";
import {
  buildDashboardMetrics,
  getDashboardText,
  getFreshnessData,
  getRouletteRepos,
  getTopLanguageCount,
  getTopRepoStars,
} from "./dashboardHelpers";

export function Dashboard({
  locale,
  onTrackClick,
}: Readonly<{
  locale: Locale;
  onTrackClick: TrackClickHandler;
}>) {
  const text = useMemo(() => getDashboardText(locale), [locale]);

  const [pulseIndex, setPulseIndex] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);
  const [rouletteIndex, setRouletteIndex] = useState(0);
  const pulseMessages = locale === "pt-BR" ? pulseMessagesPt : pulseMessagesEn;
  const githubMetrics = useGithubMetrics();

  const summary = useMemo(
    () => [
      { icon: <User className="h-4 w-4" />, label: profile.name },
      { icon: <MapPin className="h-4 w-4" />, label: profile.location },
      { icon: <Briefcase className="h-4 w-4" />, label: profile.company },
    ],
    [],
  );

  const dashboardMetrics = useMemo(
    () => buildDashboardMetrics(locale, githubMetrics),
    [githubMetrics, locale],
  );

  const topLanguageCount = getTopLanguageCount(githubMetrics);
  const topRepoStars = getTopRepoStars(githubMetrics);
  const [activeChart, setActiveChart] = useState<
    "languages" | "stars" | "freshness"
  >("languages");

  const rouletteRepos = useMemo(
    () => getRouletteRepos(githubMetrics),
    [githubMetrics],
  );

  const selectedRouletteRepo =
    rouletteRepos[rouletteIndex] ?? rouletteRepos[0] ?? null;

  const freshnessData = useMemo(
    () => getFreshnessData(githubMetrics),
    [githubMetrics],
  );

  return (
    <section className="reveal-stagger space-y-4">
      <article className="hero-panel rounded-3xl border p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {locale === "pt-BR"
            ? "Cabeçalho Profissional"
            : "Professional Header"}
        </p>
        <h2 className="mt-2 text-2xl md:text-3xl">{profile.name}</h2>
        <p className="mt-1 text-muted-foreground">
          {locale === "pt-BR" ? profile.headlinePt : profile.headlineEn}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {summary.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1"
            >
              {item.icon}
              {item.label}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <a
              href={profile.cvPtBrDownload}
              download
              onClick={() => {
                onTrackClick("/dashboard", "download-cv-ptbr");
              }}
            >
              Baixar CV PT-BR <Download className="ml-1 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href={profile.cvEnDownload}
              download
              onClick={() => {
                onTrackClick("/dashboard", "download-cv-en");
              }}
            >
              {locale === "pt-BR" ? "Download CV EN" : "Download EN CV"}{" "}
              <Download className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </article>

      <GlowCard className="rounded-3xl border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Pulse Playground
            </p>
            <h3 className="mt-1 text-xl font-semibold">{text.pulseTitle}</h3>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setPulseCount((value) => value + 1);
              setPulseIndex((value) => (value + 1) % pulseMessages.length);
              onTrackClick("/dashboard", "pulse-playground");
            }}
          >
            {text.pulseAction}
          </Button>
        </div>

        <p className="mt-3 rounded-xl border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
          {pulseMessages[pulseIndex]}
        </p>

        <div className="mt-3 h-2 rounded-full bg-secondary">
          <div
            className="neon-bar-accent h-2 transition-[width] duration-500"
            style={{ width: `${Math.max(8, (pulseCount % 10) * 10)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {text.pulseCount}: {pulseCount}
        </p>
      </GlowCard>

      <GlowCard className="rounded-3xl border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {text.rouletteKicker}
            </p>
            <h3 className="mt-1 text-xl font-semibold">{text.rouletteTitle}</h3>
          </div>
          <Button
            size="sm"
            disabled={!rouletteRepos.length}
            onClick={() => {
              if (!rouletteRepos.length) {
                return;
              }

              const nextIndex = Math.floor(
                Math.random() * rouletteRepos.length,
              );
              setRouletteIndex(nextIndex);
              onTrackClick(
                "/dashboard",
                `roulette-${rouletteRepos[nextIndex]?.name ?? "unknown"}`,
              );
            }}
          >
            {text.rouletteAction}
          </Button>
        </div>

        {selectedRouletteRepo ? (
          <div className="mt-3 rounded-xl border border-border/70 bg-background/60 p-4">
            <p className="text-sm font-semibold text-foreground">
              {selectedRouletteRepo.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedRouletteRepo.description || text.noDescription}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5">
                {selectedRouletteRepo.language}
              </span>
              <span className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5">
                {selectedRouletteRepo.stars} stars
              </span>
              <span className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5">
                {selectedRouletteRepo.forks} forks
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {text.rouletteHint}
            </p>
            <Button asChild className="mt-3" size="sm">
              <a
                href={selectedRouletteRepo.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  onTrackClick(
                    "/dashboard",
                    `roulette-open-${selectedRouletteRepo.name}`,
                  );
                }}
              >
                {text.rouletteOpen} <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {text.rouletteWaiting}
          </p>
        )}
      </GlowCard>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <GlowCard
            key={metric.label}
            className="metric-card rounded-3xl border p-6"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {metric.label}
            </p>
            <h3 className="metric-value mt-2 text-3xl font-semibold">
              {metric.value}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {metric.detail}
            </p>
          </GlowCard>
        ))}
      </section>

      <section data-reveal className="grid gap-4 md:grid-cols-2">
        <GlowCard className="spotlight-card rounded-3xl border p-6 md:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.charts}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{text.chartsTitle}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  activeChart === "languages"
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border/80 bg-background/60 text-muted-foreground hover:border-primary/50"
                }`}
                onClick={() => {
                  setActiveChart("languages");
                }}
              >
                <BarChart3 className="mr-1 inline h-3.5 w-3.5" />
                {text.tabLanguages}
              </button>
              <button
                type="button"
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  activeChart === "stars"
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border/80 bg-background/60 text-muted-foreground hover:border-primary/50"
                }`}
                onClick={() => {
                  setActiveChart("stars");
                }}
              >
                <PieChart className="mr-1 inline h-3.5 w-3.5" /> Stars
              </button>
              <button
                type="button"
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  activeChart === "freshness"
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border/80 bg-background/60 text-muted-foreground hover:border-primary/50"
                }`}
                onClick={() => {
                  setActiveChart("freshness");
                }}
              >
                <Activity className="mr-1 inline h-3.5 w-3.5" />
                {text.tabFreshness}
              </button>
            </div>
          </div>

          {activeChart === "languages" && (
            <ul className="space-y-3 text-sm text-muted-foreground">
              {(githubMetrics?.languages?.length
                ? githubMetrics.languages
                : [{ name: "N/A", count: 0 }]
              )
                .slice(0, 6)
                .map((language, index) => (
                  <li
                    key={language.name}
                    className="rounded-xl border border-border/80 bg-background/65 px-3 py-3"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{language.name}</span>
                      <span className="font-semibold text-primary">
                        {language.count}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-secondary">
                      <div
                        className="neon-bar h-2 transition-[width] duration-700"
                        style={{
                          width: `${Math.max((language.count / topLanguageCount) * 100, 8)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          )}

          {activeChart === "stars" && (
            <div className="grid gap-3 md:grid-cols-2">
              {(githubMetrics?.topRepositories?.length
                ? githubMetrics.topRepositories
                : []
              )
                .slice(0, 4)
                .map((repo) => (
                  <div
                    key={`${repo.name}-stars`}
                    className="rounded-xl border border-border/80 bg-background/65 p-4"
                  >
                    <p className="text-sm font-semibold">{repo.name}</p>
                    <div className="mt-3 flex items-end gap-3">
                      <div
                        className="neon-bar-accent w-10 rounded-t-xl"
                        style={{
                          height: `${Math.max((repo.stars / topRepoStars) * 120, 26)}px`,
                        }}
                      />
                      <div className="text-xs text-muted-foreground">
                        <p>
                          <strong className="text-foreground">
                            {repo.stars}
                          </strong>{" "}
                          stars
                        </p>
                        <p>{repo.forks} forks</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeChart === "freshness" && (
            <ul className="space-y-3">
              {(freshnessData.length
                ? freshnessData
                : [{ name: "N/A", days: 0 }]
              ).map((item) => (
                <li
                  key={`${item.name}-fresh`}
                  className="rounded-xl border border-border/80 bg-background/65 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">
                      {item.days} {locale === "pt-BR" ? "dias" : "days"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="neon-bar h-2 transition-[width] duration-700"
                      style={{
                        width: `${Math.max(8, Math.min(100, 100 - item.days))}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlowCard>

        <GlowCard className="spotlight-card rounded-3xl border p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {text.stacksVolume}
          </p>
          <h3 className="mt-2 text-xl font-semibold">
            {text.langDistribution}
          </h3>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
            {(githubMetrics?.languages?.length
              ? githubMetrics.languages
              : [{ name: "N/A", count: 0 }]
            )
              .slice(0, 6)
              .map((language) => (
                <li
                  key={language.name}
                  className="rounded-xl border border-border/80 bg-background/65 px-3 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span>{language.name}</span>
                    <span className="font-semibold text-primary">
                      {language.count}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="neon-bar h-2 transition-[width] duration-500"
                      style={{
                        width: `${Math.max((language.count / topLanguageCount) * 100, 8)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </GlowCard>
        <GlowCard className="spotlight-card rounded-3xl border p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {text.topRepos}
          </p>
          <h3 className="mt-2 text-xl font-semibold">{text.featuredRepos}</h3>
          {githubMetrics?.topRepositories?.length ? (
            <ul className="mt-3 space-y-3">
              {githubMetrics.topRepositories.slice(0, 4).map((repo) => (
                <li
                  key={repo.name}
                  className="repo-card rounded-xl border border-border/70 bg-background/60 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <a
                        className="font-semibold text-primary hover:underline"
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          onTrackClick("/dashboard", `repo-${repo.name}`);
                        }}
                      >
                        {repo.name}
                      </a>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {repo.description || text.noDescription}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {repo.stars} stars · {repo.forks} forks · {repo.language}
                    </span>
                    <span>
                      {new Date(repo.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="neon-bar-accent h-2 transition-[width] duration-500"
                      style={{
                        width: `${Math.max((repo.stars / topRepoStars) * 100, 8)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {text.waitingDaily}
            </p>
          )}
          <ChartNoAxesCombined className="mt-4 h-8 w-8 text-primary" />
        </GlowCard>
      </section>
    </section>
  );
}

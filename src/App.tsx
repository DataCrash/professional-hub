import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  ChartNoAxesCombined,
  ClipboardCheck,
  Download,
  ExternalLink,
  Gauge,
  LayoutDashboard,
  Lock,
  MapPin,
  PieChart,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { Button } from "./components/ui/button";
import {
  captureTrafficSource,
  getAnalyticsSummary,
  getClickBreakdown,
  getRecentAnalyticsEvents,
  trackClick,
  trackPageView,
} from "./lib/analytics";
import {
  clearLocalTrackingData,
  getStoredConsentDetails,
  getStoredConsentMode,
  saveConsent,
  type ConsentMode,
} from "./lib/consent";

const baseNavigation = [
  { to: "/", label: "Frontpage" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/cv-ptbr", label: "CV PT-BR" },
  { to: "/cv-en", label: "CV EN" },
  { to: "/privacidade", label: "Privacidade" },
];

type Locale = "pt-BR" | "en";

const localeStorageKey = "hub-locale-v1";

const localizedNavigation: Record<Locale, typeof baseNavigation> = {
  "pt-BR": baseNavigation,
  en: [
    { to: "/", label: "Frontpage" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/cv-ptbr", label: "CV PT-BR" },
    { to: "/cv-en", label: "CV EN" },
    { to: "/privacidade", label: "Privacy" },
  ],
};

const baseUrl = import.meta.env.BASE_URL;
const profileReadmeSnippetPath = `${baseUrl}data/github-profile-readme-snippet.md`;
const profileReviewTemplatePath = `${baseUrl}data/profile-sync-review-template.md`;

const profile = {
  name: "Alessandro Ferreira Pereira",
  headlinePt:
    "Senior .NET Engineer | Arquitetura de Soluções | Modernização de Plataformas",
  headlineEn:
    "Senior .NET Engineer | Solution Architecture | Platform Modernization",
  location: "São Paulo, Brasil",
  company: "DS3 (alocado na C&A)",
  github: "https://github.com/datacrash",
  linkedin: "https://linkedin.com/in/datacrash",
  cvPtBrDownload: `${baseUrl}cv/Senior_DotNet_Engineer_Alessandro_Pereira_BR.pdf`,
  cvEnDownload: `${baseUrl}cv/Senior_DotNet_Engineer_Alessandro_Pereira_EN.pdf`,
};

const ownerAccessStorageKey = "hub-owner-access-v1";

function hasOwnerAccess() {
  return localStorage.getItem(ownerAccessStorageKey) === "true";
}

const cvSummaryPtBrMarkdown = `## Resumo Executivo

Engenheiro de Software Sênior com atuação em modernização de plataformas .NET, evolução de sistemas legados e melhoria contínua de qualidade arquitetural.

### Destaques

- +15 anos de experiência em backend enterprise
- Foco em confiabilidade, observabilidade e performance
- Entregas orientadas a resultado para negócio e operação

### Competências-chave

- Arquitetura de soluções e design de APIs
- Modernização de aplicações .NET e integração entre sistemas
- Práticas de qualidade: testes, revisão técnica e governança de código

### Contexto de atuação

Atuação em ambientes de alta criticidade, conectando visão técnica e execução para reduzir risco de entrega e aumentar previsibilidade.`;

const cvSummaryEnMarkdown = `## Executive Summary

Senior Software Engineer focused on .NET platform modernization, backend architecture and reliable delivery in enterprise contexts.

### Highlights

- 15+ years of backend engineering experience
- Strong focus on reliability, observability and maintainability
- Delivery aligned with measurable product and operational outcomes

### Core Capabilities

- Solution architecture and API design
- Legacy-to-modern .NET modernization strategies
- Engineering quality practices: testing, code review and standards

### Delivery Context

Hands-on technical leadership in complex environments, balancing execution speed, quality and long-term sustainability.`;

function MarkdownPreview({ markdown }: Readonly<{ markdown: string }>) {
  const blocks = markdown
    .split("\n\n")
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div className="markdown-preview space-y-4 text-sm text-muted-foreground">
      {blocks.map((block, index) => {
        if (block.startsWith("### ")) {
          return (
            <h4
              key={`${block}-${index}`}
              className="text-base font-semibold text-foreground"
            >
              {block.replace("### ", "")}
            </h4>
          );
        }

        if (block.startsWith("## ")) {
          return (
            <h3
              key={`${block}-${index}`}
              className="text-lg font-semibold text-foreground"
            >
              {block.replace("## ", "")}
            </h3>
          );
        }

        if (block.split("\n").every((line) => line.startsWith("- "))) {
          return (
            <ul key={`${block}-${index}`} className="list-disc space-y-1 pl-5">
              {block.split("\n").map((line) => (
                <li key={line}>{line.replace("- ", "")}</li>
              ))}
            </ul>
          );
        }

        return <p key={`${block}-${index}`}>{block}</p>;
      })}
    </div>
  );
}

type GitHubMetrics = {
  profile: {
    username: string;
    profileUrl: string;
    fetchedAt: string;
  };
  totals: {
    repositories: number;
    stars: number;
    forks: number;
    openIssues: number;
  };
  languages: Array<{
    name: string;
    count: number;
  }>;
  topRepositories: Array<{
    name: string;
    description: string | null;
    url: string;
    stars: number;
    forks: number;
    language: string;
    updatedAt: string;
  }>;
};

type ProfileSyncPayload = {
  name: string;
  headlinePt: string;
  headlineEn: string;
  location: string;
  currentCompany: string;
  githubUrl: string;
  linkedinUrl: string;
  cvDownloads: {
    ptBr: string;
    en: string;
  };
  targetRoles: {
    ptBr: string[];
    en: string[];
  };
  notes: {
    usage: string;
    humanCheckpointRequired: boolean;
  };
};

type ObservedProfileState = {
  githubBio: string;
  githubLocation: string;
  linkedinHeadline: string;
  linkedinLocation: string;
  linkedinCompany: string;
};

const observedProfileStorageKey = "profile-sync-observed-v1";

function getDiffStatus(expected: string, observedValue: string) {
  if (!observedValue.trim()) return "não avaliado";
  return expected.trim().toLowerCase() === observedValue.trim().toLowerCase()
    ? "ok"
    : "divergente";
}

function getDiffStatusClasses(status: string) {
  if (status === "ok")
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (status === "divergente")
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return "border-border/70 bg-background/70 text-muted-foreground";
}

function buildSyncKitDiagnosticMarkdown({
  payload,
  readiness,
  comparisonRows,
}: Readonly<{
  payload: ProfileSyncPayload | null;
  readiness: {
    total: number;
    ok: number;
    divergent: number;
    pending: number;
    evaluated: number;
    completion: number;
    readyForCheckpoint: boolean;
  };
  comparisonRows: Array<{ label: string; expected: string; observed: string }>;
}>) {
  const now = new Date().toISOString();
  const source = payload?.notes.usage ?? "Sync Kit local snapshot";

  const lines = [
    "# Sync Kit Diagnostic Report",
    "",
    `- Generated at (UTC): ${now}`,
    `- Source: ${source}`,
    `- Ready for checkpoint: ${readiness.readyForCheckpoint ? "yes" : "no"}`,
    `- Completion: ${readiness.completion}%`,
    "",
    "## Summary",
    "",
    `- Evaluated: ${readiness.evaluated}/${readiness.total}`,
    `- OK: ${readiness.ok}`,
    `- Divergent: ${readiness.divergent}`,
    `- Pending: ${readiness.pending}`,
    "",
    "## Expected vs Observed",
    "",
  ];

  comparisonRows.forEach((row) => {
    lines.push(
      `- ${row.label}`,
      `  - Expected: ${row.expected || "n/a"}`,
      `  - Observed: ${row.observed || "n/a"}`,
    );
  });

  lines.push(
    "",
    "## Decision",
    "",
    "- Reviewer:",
    "- Decision: approved / needs-adjustments",
    "- Notes:",
  );

  return `${lines.join("\n")}\n`;
}

const fitRolesPt = [
  "Engenheiro de Software Senior (.NET)",
  "Desenvolvedor Backend Senior (.NET)",
  "Engenheiro de Modernização de Plataformas",
  "Arquiteto de Soluções (hands-on)",
  "Tech Lead Backend",
];

const fitRolesEn = [
  "Senior .NET Software Engineer",
  "Senior Backend Engineer (.NET)",
  "Platform Modernization Engineer",
  "Solutions Architect (hands-on)",
  "Backend Tech Lead",
];

const volunteerHighlightsPt = [
  "Chefe Escoteiro - Assistente da Tropa Escoteira",
  "453SP Grupo Escoteiro do Ar Alpha Centauri",
  "Liderança prática, mentoria e formação de jovens",
];

const volunteerHighlightsEn = [
  "Scout Leader - Assistant of the Scout Troop",
  "453SP Grupo Escoteiro do Ar Alpha Centauri",
  "Hands-on leadership, mentoring and youth development",
];

const pulseMessagesPt = [
  "Pulso emitido: rota para LinkedIn reforcada.",
  "Sinal ativo: CV PT-BR pronto para download.",
  "Update rapido: novos dados de repositorios em leitura.",
  "Hub online: narrativa tecnica em modo de conversao.",
];

const pulseMessagesEn = [
  "Pulse emitted: LinkedIn route reinforced.",
  "Signal active: PT-BR CV ready for download.",
  "Quick update: new repository data in read mode.",
  "Hub online: technical narrative in conversion mode.",
];

function RouteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    trackPageView(path);
    captureTrafficSource(path);
  }, [location.pathname, location.search]);

  return null;
}

function ConsentBanner() {
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

// Mouse-tracking spotlight card
function GlowCard({
  children,
  className = "",
}: Readonly<{ children: ReactNode; className?: string }>) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--gx", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--gy", `${e.clientY - rect.top}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    ref.current?.style.setProperty("--gx", "-9999px");
    ref.current?.style.setProperty("--gy", "-9999px");
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave, handleMouseMove]);

  return (
    <div ref={ref} className={`glow-card ${className}`}>
      {children}
    </div>
  );
}

// IntersectionObserver scroll reveal
function ScrollReveal({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();

  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, [location.pathname]);

  return <>{children}</>;
}

function Layout({
  children,
  locale,
  onLocaleChange,
}: Readonly<{
  children: ReactNode;
  locale: Locale;
  onLocaleChange: (value: Locale) => void;
}>) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const syncOwnerAccess = () => {
      setIsOwner(hasOwnerAccess());
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
    <div className="hub-shell mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8">
      <div className="hub-atmosphere" aria-hidden="true">
        <div className="signal-field" />
        <div className="hub-atmosphere-blob3" />
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
                  trackClick("/header", "github");
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
                  trackClick("/header", "linkedin");
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
                  trackClick("/nav", item.label.toLowerCase());
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

function PageCard({
  title,
  description,
  icon,
}: Readonly<{
  title: string;
  description: string;
  icon: ReactNode;
}>) {
  return (
    <GlowCard className="rounded-3xl border p-6">
      <div className="mb-4 inline-flex rounded-2xl border border-border bg-background/90 p-2.5 text-primary">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-muted-foreground">{description}</p>
    </GlowCard>
  );
}

function Frontpage({ locale }: Readonly<{ locale: Locale }>) {
  const text =
    locale === "pt-BR"
      ? {
          chip: "Posicionamento Profissional",
          title: "Hub técnico para recrutadores e lideranças de engenharia",
          body: "Esta frontpage concentra narrativa profissional, acesso ao dashboard técnico e currículos em dois idiomas. O objetivo é reduzir fricção na avaliação de fit técnico e acelerar a tomada de decisão para entrevistas.",
          ctaDashboard: "Ver Dashboard",
          ctaCvPt: "Ler CV PT-BR",
          ctaCvEn: "Ler CV EN",
          readiness: "Sinais de prontidão",
          readinessTitle: "Avaliação técnica em poucos minutos",
          item1: "Contexto de carreira com foco em plataforma e arquitetura",
          item2: "Evidências de repositórios e stacks de atuação",
          item3: "CV PT-BR e EN com rota de navegação direta",
          years: "Anos",
          decisionFlow: "Fluxo orientado a decisão técnica",
          card1Title: "Foco em impacto técnico",
          card1Desc:
            "Arquitetura, modernização de plataformas e entrega de software em ambientes enterprise com baixa fricção operacional.",
          card2Title: "Jornada de avaliação clara",
          card2Desc:
            "GitHub -> Frontpage -> Dashboard -> CVs com contexto profissional e evidências técnicas no menor número de cliques.",
          why: "Por que esse hub funciona",
          why1Title: "Narrativa objetiva",
          why1Desc:
            "Informação priorizada para reduzir ruído na triagem técnica.",
          why2Title: "Dados verificaveis",
          why2Desc:
            "Dashboard puxa metricas reais e evidencia tecnologias com clareza.",
          why3Title: "Navegação curta",
          why3Desc:
            "Rota direta para CV, portfolio e pontos de contato profissional.",
        }
      : {
          chip: "Professional Positioning",
          title: "Technical hub for recruiters and engineering leaders",
          body: "This frontpage centralizes professional narrative, technical dashboard access, and bilingual CVs. The goal is to reduce friction during technical fit assessment and speed up interview decisions.",
          ctaDashboard: "Open Dashboard",
          ctaCvPt: "Read CV PT-BR",
          ctaCvEn: "Read CV EN",
          readiness: "Readiness signals",
          readinessTitle: "Technical evaluation in just a few minutes",
          item1: "Career context focused on platforms and architecture",
          item2: "Repository evidence and technology stack signals",
          item3: "PT-BR and EN CVs with direct navigation routes",
          years: "Years",
          decisionFlow: "Flow optimized for technical decisions",
          card1Title: "Focus on technical impact",
          card1Desc:
            "Architecture, platform modernization and software delivery in enterprise environments with low operational friction.",
          card2Title: "Clear evaluation journey",
          card2Desc:
            "GitHub -> Frontpage -> Dashboard -> CVs with professional context and technical evidence in the fewest clicks.",
          why: "Why this hub works",
          why1Title: "Objective narrative",
          why1Desc:
            "Prioritized information to reduce noise in technical screening.",
          why2Title: "Verifiable data",
          why2Desc:
            "Dashboard pulls real metrics and highlights technologies clearly.",
          why3Title: "Short navigation",
          why3Desc:
            "Direct route to CV, portfolio and professional contact points.",
        };

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
                    trackClick("/", "cta-dashboard");
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
                    trackClick("/", "cta-cv-ptbr");
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
                    trackClick("/", "cta-cv-en");
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

function Dashboard({ locale }: Readonly<{ locale: Locale }>) {
  const text =
    locale === "pt-BR"
      ? {
          charts: "Gráficos dinâmicos",
          chartsTitle: "Mesmos dados, visualizações diferentes",
          tabLanguages: "Linguagens",
          tabFreshness: "Atualização",
          stacksVolume: "Stacks por volume",
          langDistribution: "Distribuição por linguagem",
          topRepos: "Top repositórios",
          featuredRepos: "Repositórios em destaque",
          noDescription: "Sem descrição pública.",
          waitingDaily: "Aguardando dados da pipeline diária.",
          pulseTitle: "Entretenimento com sinal útil",
          pulseAction: "Emitir pulso",
          pulseCount: "Pulsos emitidos nesta sessão",
          rouletteKicker: "Repo Roulette",
          rouletteTitle: "Sorteio dinâmico de repositórios",
          rouletteAction: "Sortear repo",
          rouletteOpen: "Abrir repo sorteado",
          rouletteHint: "Use para explorar rapidamente projetos-chave.",
          rouletteWaiting: "Aguardando dados de repositórios para o sorteio.",
        }
      : {
          charts: "Dynamic charts",
          chartsTitle: "Same data, different visualizations",
          tabLanguages: "Languages",
          tabFreshness: "Freshness",
          stacksVolume: "Stacks by volume",
          langDistribution: "Language distribution",
          topRepos: "Top repositories",
          featuredRepos: "Featured repositories",
          noDescription: "No public description.",
          waitingDaily: "Waiting for daily pipeline data.",
          pulseTitle: "Entertainment with useful signal",
          pulseAction: "Emit pulse",
          pulseCount: "Pulses emitted in this session",
          rouletteKicker: "Repo Roulette",
          rouletteTitle: "Dynamic repository draw",
          rouletteAction: "Draw repo",
          rouletteOpen: "Open drawn repo",
          rouletteHint: "Use it to quickly explore key projects.",
          rouletteWaiting: "Waiting for repository data for the draw.",
        };

  const [pulseIndex, setPulseIndex] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);
  const [rouletteIndex, setRouletteIndex] = useState(0);
  const pulseMessages = locale === "pt-BR" ? pulseMessagesPt : pulseMessagesEn;

  const summary = useMemo(
    () => [
      { icon: <User className="h-4 w-4" />, label: profile.name },
      { icon: <MapPin className="h-4 w-4" />, label: profile.location },
      { icon: <Briefcase className="h-4 w-4" />, label: profile.company },
    ],
    [],
  );

  const [githubMetrics, setGithubMetrics] = useState<GitHubMetrics | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      try {
        const response = await fetch(`${baseUrl}data/github-metrics.json`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as GitHubMetrics;
        if (isMounted) {
          setGithubMetrics(data);
        }
      } catch {
        // Keep fallback UI when metrics file is unavailable.
      }
    }

    void loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardMetrics = useMemo(() => {
    const years = "15+";
    const waitingText =
      locale === "pt-BR"
        ? "Aguardando pipeline de dados GitHub"
        : "Waiting for GitHub data pipeline";

    if (!githubMetrics) {
      return [
        {
          label:
            locale === "pt-BR"
              ? "Repositórios públicos"
              : "Public repositories",
          value: "-",
          detail: waitingText,
        },
        {
          label: "Total stars",
          value: "-",
          detail: waitingText,
        },
        {
          label:
            locale === "pt-BR" ? "Anos de experiência" : "Years of experience",
          value: years,
          detail:
            locale === "pt-BR"
              ? "Atuação em ambientes enterprise e legado"
              : "Hands-on delivery in enterprise and legacy environments",
        },
      ];
    }

    return [
      {
        label:
          locale === "pt-BR" ? "Repositórios públicos" : "Public repositories",
        value: String(githubMetrics.totals.repositories),
        detail:
          locale === "pt-BR"
            ? `Atualizado em ${new Date(githubMetrics.profile.fetchedAt).toLocaleString("pt-BR")}`
            : `Updated at ${new Date(githubMetrics.profile.fetchedAt).toLocaleString("en-US")}`,
      },
      {
        label: "Total stars",
        value: String(githubMetrics.totals.stars),
        detail:
          locale === "pt-BR"
            ? `${githubMetrics.totals.forks} forks e ${githubMetrics.totals.openIssues} issues abertas`
            : `${githubMetrics.totals.forks} forks and ${githubMetrics.totals.openIssues} open issues`,
      },
      {
        label:
          locale === "pt-BR" ? "Anos de experiência" : "Years of experience",
        value: years,
        detail:
          locale === "pt-BR"
            ? "Atuação em ambientes enterprise e legado"
            : "Hands-on delivery in enterprise and legacy environments",
      },
    ];
  }, [githubMetrics, locale]);

  const topLanguageCount = githubMetrics?.languages?.[0]?.count ?? 1;
  const topRepoStars = Math.max(
    ...(githubMetrics?.topRepositories?.map((repo) => repo.stars) ?? [1]),
  );
  const [activeChart, setActiveChart] = useState<
    "languages" | "stars" | "freshness"
  >("languages");

  const rouletteRepos = useMemo(
    () =>
      githubMetrics?.topRepositories?.length
        ? githubMetrics.topRepositories.slice(0, 8)
        : [],
    [githubMetrics],
  );

  const selectedRouletteRepo = rouletteRepos[rouletteIndex] ?? null;

  useEffect(() => {
    setRouletteIndex(0);
  }, [githubMetrics]);

  const freshnessData = useMemo(() => {
    const repos = githubMetrics?.topRepositories ?? [];
    return repos.slice(0, 4).map((repo) => {
      const days = Math.max(
        1,
        Math.round(
          (Date.now() - new Date(repo.updatedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      return {
        name: repo.name,
        days,
      };
    });
  }, [githubMetrics]);

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
                trackClick("/dashboard", "download-cv-ptbr");
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
                trackClick("/dashboard", "download-cv-en");
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
              trackClick("/dashboard", "pulse-playground");
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
              trackClick(
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
                  trackClick(
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
                          trackClick("/dashboard", `repo-${repo.name}`);
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

function CvPtBr() {
  return (
    <section className="grid gap-4 md:grid-cols-5">
      <article className="md:col-span-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          CV PT-BR
        </p>
        <h2 className="mt-2 text-3xl">Senior .NET Engineer</h2>
        <p className="mt-3 text-muted-foreground">
          Engenheiro de Software Sênior com foco em backend, modernização de
          plataformas e evolução de sistemas críticos em ambientes enterprise.
        </p>
        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  trackClick("/cv-ptbr", "open-linkedin");
                }}
              >
                LinkedIn <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  trackClick("/cv-ptbr", "open-github");
                }}
              >
                GitHub <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild>
              <a
                href={profile.cvPtBrDownload}
                download
                onClick={() => {
                  trackClick("/cv-ptbr", "download-cv-ptbr");
                }}
              >
                Baixar PDF PT-BR <Download className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </article>
      <article className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Vagas com fit
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {fitRolesPt.map((role) => (
            <li
              key={role}
              className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
            >
              {role}
            </li>
          ))}
        </ul>
      </article>

      <article className="md:col-span-5 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Comportamento e liderança
        </p>
        <h3 className="mt-2 text-2xl font-semibold">Atuação voluntária</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {volunteerHighlightsPt.map((highlight) => (
            <li
              key={highlight}
              className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
            >
              {highlight}
            </li>
          ))}
        </ul>
      </article>

      <article className="md:col-span-5 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Resumo em Markdown
        </p>
        <h3 className="mt-2 text-2xl font-semibold">
          Visão geral detalhada do CV PT-BR
        </h3>
        <div className="mt-4 rounded-xl border border-border/70 bg-background/55 p-4">
          <MarkdownPreview markdown={cvSummaryPtBrMarkdown} />
        </div>
      </article>
    </section>
  );
}

function CvEn() {
  return (
    <section className="grid gap-4 md:grid-cols-5">
      <article className="md:col-span-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Resume EN
        </p>
        <h2 className="mt-2 text-3xl">Senior .NET Software Engineer</h2>
        <p className="mt-3 text-muted-foreground">
          Senior software engineer focused on backend systems, platform
          modernization and reliable delivery in high-complexity enterprise
          contexts.
        </p>
        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  trackClick("/cv-en", "open-linkedin");
                }}
              >
                LinkedIn <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  trackClick("/cv-en", "open-github");
                }}
              >
                GitHub <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild>
              <a
                href={profile.cvEnDownload}
                download
                onClick={() => {
                  trackClick("/cv-en", "download-cv-en");
                }}
              >
                Download PDF EN <Download className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </article>
      <article className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Target roles
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {fitRolesEn.map((role) => (
            <li
              key={role}
              className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
            >
              {role}
            </li>
          ))}
        </ul>
      </article>

      <article className="md:col-span-5 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Behavior and leadership
        </p>
        <h3 className="mt-2 text-2xl font-semibold">Volunteer experience</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {volunteerHighlightsEn.map((highlight) => (
            <li
              key={highlight}
              className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
            >
              {highlight}
            </li>
          ))}
        </ul>
      </article>

      <article className="md:col-span-5 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Markdown Summary
        </p>
        <h3 className="mt-2 text-2xl font-semibold">
          Detailed CV overview (EN)
        </h3>
        <div className="mt-4 rounded-xl border border-border/70 bg-background/55 p-4">
          <MarkdownPreview markdown={cvSummaryEnMarkdown} />
        </div>
      </article>
    </section>
  );
}

function Privacy({ locale }: Readonly<{ locale: Locale }>) {
  const [mode, setMode] = useState<ConsentMode>(() => getStoredConsentMode());
  const [analytics, setAnalytics] = useState(
    () => getStoredConsentDetails().analytics,
  );
  const [traffic, setTraffic] = useState(
    () => getStoredConsentDetails().traffic,
  );
  const [summary, setSummary] = useState(() => getAnalyticsSummary());

  const recentEvents = getRecentAnalyticsEvents();
  const clickBreakdown = getClickBreakdown();
  const emptyEvents = [{ type: "page_view", path: "-", ts: "-", label: "-" }];

  const text =
    locale === "pt-BR"
      ? {
          profileData: "Dados do perfil (públicos)",
          visitorData: "Dados do visitante (locais)",
          consentState: "Estado atual de consentimento",
          analyticsDetailed: "Analytics detalhado",
          trafficSource: "Origem de tráfego",
          active: "ativo",
          disabled: "desativado",
          localEvents: "Eventos locais registrados",
          localPageViews: "Page views locais",
          trackedClicks: "Cliques rastreados localmente",
          initialSource: "Origem inicial capturada",
          notCaptured: "não capturada",
          noAutoIdentification:
            "Não há autoidentificação de visitante por nome, e-mail ou conta externa sem consentimento explícito.",
          controls: "Controles",
          localInspection: "Painel local de inspeção",
          browserEvents: "Eventos e origem capturados no navegador",
          topClicks: "Top cliques",
          noClicks: "sem-cliques",
          recentEvents: "Eventos recentes",
        }
      : {
          profileData: "Profile data (public)",
          visitorData: "Visitor data (local)",
          consentState: "Current consent state",
          analyticsDetailed: "Detailed analytics",
          trafficSource: "Traffic source",
          active: "active",
          disabled: "disabled",
          localEvents: "Local events recorded",
          localPageViews: "Local page views",
          trackedClicks: "Tracked local clicks",
          initialSource: "Captured initial source",
          notCaptured: "not captured",
          noAutoIdentification:
            "There is no automatic visitor identification by name, email, or external account without explicit consent.",
          controls: "Controls",
          localInspection: "Local inspection panel",
          browserEvents: "Events and source captured in the browser",
          topClicks: "Top clicks",
          noClicks: "no-clicks",
          recentEvents: "Recent events",
        };

  function refreshAnalyticsPanel() {
    setSummary(getAnalyticsSummary());
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 inline-flex rounded-xl border border-border bg-background p-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="text-2xl">
          {locale === "pt-BR"
            ? "Privacidade e Consentimento"
            : "Privacy and Consent"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "pt-BR"
            ? "Esta seção trata de dois assuntos distintos: exibição de dados públicos do perfil profissional e coleta de dados de navegação do visitante. Nenhuma identificação pessoal é feita automaticamente."
            : "This section covers two separate topics: display of public professional profile data and visitor navigation data collection. No personal identification is performed automatically."}
        </p>
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
          <Button
            size="sm"
            onClick={() => {
              saveConsent("accepted", { analytics: true, traffic: true });
              setMode("accepted");
              setAnalytics(true);
              setTraffic(true);
              setSummary(getAnalyticsSummary());
            }}
          >
            {locale === "pt-BR" ? "Aceitar tudo" : "Accept all"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              saveConsent("rejected", { analytics: false, traffic: false });
              setMode("rejected");
              setAnalytics(false);
              setTraffic(false);
              setSummary(getAnalyticsSummary());
            }}
          >
            {locale === "pt-BR" ? "Recusar" : "Reject"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              saveConsent("custom", { analytics: true, traffic: false });
              setMode("custom");
              setAnalytics(true);
              setTraffic(false);
              setSummary(getAnalyticsSummary());
            }}
          >
            {locale === "pt-BR" ? "Personalizar" : "Customize"}
          </Button>
        </div>
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearLocalTrackingData();
              setMode("unset");
              setAnalytics(false);
              setTraffic(false);
              setSummary(getAnalyticsSummary());
            }}
          >
            {locale === "pt-BR"
              ? "Apagar meus dados locais"
              : "Delete my local data"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={refreshAnalyticsPanel}
          >
            {locale === "pt-BR" ? "Atualizar painel" : "Refresh panel"}
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

function OwnerAccessGate({ locale }: Readonly<{ locale: Locale }>) {
  const [username, setUsername] = useState("");
  const [isOwner, setIsOwner] = useState(() => hasOwnerAccess());

  const text =
    locale === "pt-BR"
      ? {
          restricted: "Área restrita",
          title: "Sync Kit visível apenas para o proprietário",
          body: "Para reduzir exposição operacional, esta seção fica oculta para visitantes. Faça a validação com seu usuário GitHub para liberar o painel localmente neste navegador.",
          quickValidation: "Validação rápida",
          githubUser: "Usuário GitHub",
          placeholder: "Digite datacrash",
          unlock: "Liberar acesso local",
          note: "Nota",
          noteBody:
            "Esta proteção é de visibilidade na interface (frontend). Para segurança forte, o ideal é mover o Sync Kit para backend autenticado (GitHub OAuth ou acesso privado no repositório).",
        }
      : {
          restricted: "Restricted area",
          title: "Sync Kit visible only to the owner",
          body: "To reduce operational exposure, this section is hidden for visitors. Validate with your GitHub user to unlock the panel locally in this browser.",
          quickValidation: "Quick validation",
          githubUser: "GitHub user",
          placeholder: "Type datacrash",
          unlock: "Unlock local access",
          note: "Note",
          noteBody:
            "This is a UI visibility protection (frontend). For stronger security, move Sync Kit to an authenticated backend (GitHub OAuth or private repository access).",
        };

  if (isOwner) {
    return <SyncKit locale={locale} />;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 inline-flex rounded-xl border border-border bg-background p-2 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.restricted}
        </p>
        <h2 className="mt-2 text-3xl">{text.title}</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">{text.body}</p>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.quickValidation}
        </p>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-muted-foreground">
            {text.githubUser}
          </span>
          <input
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            placeholder={text.placeholder}
          />
        </label>
        <Button
          className="mt-3"
          onClick={() => {
            if (username.trim().toLowerCase() === "datacrash") {
              localStorage.setItem(ownerAccessStorageKey, "true");
              globalThis.dispatchEvent(new Event("hub-owner-access-changed"));
              setIsOwner(true);
            }
          }}
        >
          {text.unlock}
        </Button>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.note}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{text.noteBody}</p>
      </article>
    </section>
  );
}

function SyncKit({ locale }: Readonly<{ locale: Locale }>) {
  const [payload, setPayload] = useState<ProfileSyncPayload | null>(null);
  const [observed, setObserved] = useState<ObservedProfileState>({
    githubBio: "",
    githubLocation: "",
    linkedinHeadline: "",
    linkedinLocation: "",
    linkedinCompany: "",
  });

  useEffect(() => {
    const raw = localStorage.getItem(observedProfileStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<ObservedProfileState>;
      setObserved((previous) => ({
        ...previous,
        ...parsed,
      }));
    } catch {
      // Ignore malformed local snapshot and keep defaults.
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPayload() {
      try {
        const response = await fetch(
          `${baseUrl}data/profile-sync-payload.json`,
          { cache: "no-store" },
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
    ? `I build and modernize enterprise backend platforms with .NET, focusing on reliability, architecture quality, and measurable delivery outcomes.`
    : loadingPayloadText;

  const text =
    locale === "pt-BR"
      ? {
          assistedIntegration: "Integração Assistida",
          syncKitTitle: "Sync Kit para GitHub e LinkedIn",
          syncKitBody:
            "Este painel organiza os dados de perfil em um formato pronto para atualização manual com checkpoint humano. Nenhuma alteração é submetida automaticamente em plataformas externas.",
          payloadSnapshot: "Snapshot do payload",
          name: "Nome",
          location: "Localização",
          company: "Empresa atual",
          checkpoint: "Checkpoint humano",
          required: "obrigatório",
          no: "não",
          usage: "Uso",
          waitingPayload: "Aguardando leitura de profile-sync-payload.json.",
          diffMatrix: "Matriz de diferença",
          expectedObserved: "Esperado vs observado",
          expectedObservedBody:
            "Preencha os valores atualmente visíveis em GitHub e LinkedIn para validar convergência antes do checkpoint humano de publicação.",
          readinessSummary: "Resumo de prontidão",
          fieldsEvaluated: "campos avaliados",
          ready: "pronto para checkpoint humano",
          pending: "ainda pendente",
          divergentPending: "Pendências divergentes",
          noDivergence: "Nenhuma divergencia detectada.",
          nonEvaluatedPending: "Pendências não avaliadas",
          fillObserved: "Acao: preencher valor observado no formulario.",
          allEvaluated: "Todos os campos ja foram avaliados.",
          observedValues: "Valores observados (entrada manual)",
          compareResult: "Resultado da comparação",
          expected: "Esperado",
          observed: "Observado",
          clearSnapshot: "Limpar snapshot observado",
          exportDiagnostic: "Exportar diagnóstico MD",
          checklist: "Checklist rapido",
          checklist1: "Confirmar headline PT-BR e EN antes de publicar",
          checklist2:
            "Confirmar website do GitHub apontando para a frontpage publicada",
          checklist3: "Confirmar links de CV PT-BR e EN funcionando",
          checklist4:
            "Realizar checkpoint humano antes de salvar qualquer alteração",
          openReadmeSnippet: "Abrir snippet README",
          openReviewTemplate: "Abrir template de revisão",
          readyTexts: "Textos prontos para uso",
          githubBioSuggestion: "Sugestao GitHub Bio",
          openGithubProfile: "Abrir GitHub Profile",
          linkedinAboutSuggestion: "Sugestao LinkedIn About (EN)",
          openLinkedinProfile: "Abrir LinkedIn Profile",
          targetRolesPt: "Roles alvo PT-BR",
          targetRolesEn: "Target roles EN",
          topClicks: "Top cliques",
          noClicks: "sem-cliques",
          recentEvents: "Eventos recentes",
          localInspection: "Painel local de inspeção",
          browserEvents: "Eventos e origem capturados no navegador",
          controls: "Controles",
          profileData: "Dados do perfil (públicos)",
          visitorData: "Dados do visitante (locais)",
          consentState: "Estado atual de consentimento",
          analyticsDetailed: "Analytics detalhado",
          trafficSource: "Origem de tráfego",
          active: "ativo",
          disabled: "desativado",
          localEvents: "Eventos locais registrados",
          localPageViews: "Page views locais",
          trackedClicks: "Cliques rastreados localmente",
          initialSource: "Origem inicial capturada",
          notCaptured: "não capturada",
          noAutoIdentification:
            "Não há autoidentificação de visitante por nome, e-mail ou conta externa sem consentimento explícito.",
        }
      : {
          assistedIntegration: "Assisted Integration",
          syncKitTitle: "Sync Kit for GitHub and LinkedIn",
          syncKitBody:
            "This panel organizes profile data in a format ready for manual updates with a human checkpoint. No changes are submitted automatically to external platforms.",
          payloadSnapshot: "Payload snapshot",
          name: "Name",
          location: "Location",
          company: "Current company",
          checkpoint: "Human checkpoint",
          required: "required",
          no: "no",
          usage: "Usage",
          waitingPayload: "Waiting for profile-sync-payload.json.",
          diffMatrix: "Difference matrix",
          expectedObserved: "Expected vs observed",
          expectedObservedBody:
            "Fill in the values currently visible in GitHub and LinkedIn to validate convergence before the human publishing checkpoint.",
          readinessSummary: "Readiness summary",
          fieldsEvaluated: "evaluated fields",
          ready: "ready for human checkpoint",
          pending: "still pending",
          divergentPending: "Divergent pending items",
          noDivergence: "No divergence detected.",
          nonEvaluatedPending: "Not evaluated pending items",
          fillObserved: "Action: fill in the observed value in the form.",
          allEvaluated: "All fields are already evaluated.",
          observedValues: "Observed values (manual input)",
          compareResult: "Comparison result",
          expected: "Expected",
          observed: "Observed",
          clearSnapshot: "Clear observed snapshot",
          exportDiagnostic: "Export MD diagnostic",
          checklist: "Quick checklist",
          checklist1: "Confirm PT-BR and EN headline before publishing",
          checklist2:
            "Confirm GitHub website points to the published frontpage",
          checklist3: "Confirm PT-BR and EN CV links are working",
          checklist4: "Perform human checkpoint before saving any change",
          openReadmeSnippet: "Open README snippet",
          openReviewTemplate: "Open review template",
          readyTexts: "Ready-to-use texts",
          githubBioSuggestion: "GitHub Bio suggestion",
          openGithubProfile: "Open GitHub Profile",
          linkedinAboutSuggestion: "LinkedIn About suggestion (EN)",
          openLinkedinProfile: "Open LinkedIn Profile",
          targetRolesPt: "Target roles PT-BR",
          targetRolesEn: "Target roles EN",
          topClicks: "Top clicks",
          noClicks: "no-clicks",
          recentEvents: "Recent events",
          localInspection: "Local inspection panel",
          browserEvents: "Events and source captured in the browser",
          controls: "Controls",
          profileData: "Profile data (public)",
          visitorData: "Visitor data (local)",
          consentState: "Current consent state",
          analyticsDetailed: "Detailed analytics",
          trafficSource: "Traffic source",
          active: "active",
          disabled: "disabled",
          localEvents: "Local events recorded",
          localPageViews: "Local page views",
          trackedClicks: "Tracked local clicks",
          initialSource: "Captured initial source",
          notCaptured: "not captured",
          noAutoIdentification:
            "There is no automatic visitor identification by name, email, or external account without explicit consent.",
        };

  const expectedGithubBio = payload
    ? `${payload.headlineEn} | ${payload.location} | ${payload.currentCompany}`
    : "";
  const expectedGithubLocation = payload?.location ?? "";
  const expectedLinkedinHeadline = payload?.headlineEn ?? "";
  const expectedLinkedinLocation = payload?.location ?? "";
  const expectedLinkedinCompany = payload?.currentCompany ?? "";

  const comparisonRows = useMemo(
    () => [
      {
        label: "GitHub Bio",
        expected: expectedGithubBio,
        observed: observed.githubBio,
      },
      {
        label: "GitHub Location",
        expected: expectedGithubLocation,
        observed: observed.githubLocation,
      },
      {
        label: "LinkedIn Headline",
        expected: expectedLinkedinHeadline,
        observed: observed.linkedinHeadline,
      },
      {
        label: "LinkedIn Location",
        expected: expectedLinkedinLocation,
        observed: observed.linkedinLocation,
      },
      {
        label: "LinkedIn Company",
        expected: expectedLinkedinCompany,
        observed: observed.linkedinCompany,
      },
    ],
    [
      expectedGithubBio,
      expectedGithubLocation,
      expectedLinkedinCompany,
      expectedLinkedinHeadline,
      expectedLinkedinLocation,
      observed.githubBio,
      observed.githubLocation,
      observed.linkedinCompany,
      observed.linkedinHeadline,
      observed.linkedinLocation,
    ],
  );

  const readiness = useMemo(() => {
    let ok = 0;
    let divergent = 0;
    let pending = 0;

    comparisonRows.forEach((row) => {
      const status = getDiffStatus(row.expected, row.observed);
      if (status === "ok") ok += 1;
      if (status === "divergente") divergent += 1;
      if (status === "não avaliado") pending += 1;
    });

    const total = comparisonRows.length;
    const evaluated = total - pending;
    const completion = total ? Math.round((evaluated / total) * 100) : 0;
    const readyForCheckpoint = pending === 0 && divergent === 0;

    return {
      total,
      ok,
      divergent,
      pending,
      evaluated,
      completion,
      readyForCheckpoint,
    };
  }, [comparisonRows]);

  const actionableDiffs = useMemo(() => {
    const divergentRows = comparisonRows.filter(
      (row) => getDiffStatus(row.expected, row.observed) === "divergente",
    );
    const pendingRows = comparisonRows.filter(
      (row) => getDiffStatus(row.expected, row.observed) === "não avaliado",
    );

    return {
      divergentRows,
      pendingRows,
    };
  }, [comparisonRows]);

  const diagnosticMarkdown = useMemo(
    () =>
      buildSyncKitDiagnosticMarkdown({ payload, readiness, comparisonRows }),
    [payload, readiness, comparisonRows],
  );

  function updateObserved(field: keyof ObservedProfileState, value: string) {
    setObserved((previous) => {
      const next = {
        ...previous,
        [field]: value,
      };
      localStorage.setItem(observedProfileStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function clearObservedSnapshot() {
    localStorage.removeItem(observedProfileStorageKey);
    setObserved({
      githubBio: "",
      githubLocation: "",
      linkedinHeadline: "",
      linkedinLocation: "",
      linkedinCompany: "",
    });
  }

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
                trackClick("/sync-kit", "open-readme-snippet");
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
                trackClick("/sync-kit", "open-review-template");
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
                trackClick("/sync-kit", "open-github-profile");
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
                trackClick("/sync-kit", "open-linkedin-profile");
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

function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem(localeStorageKey);
    return stored === "en" ? "en" : "pt-BR";
  });

  const handleLocaleChange = useCallback((value: Locale) => {
    setLocale(value);
    localStorage.setItem(localeStorageKey, value);
  }, []);

  return (
    <BrowserRouter basename={baseUrl}>
      <RouteAnalyticsTracker />
      <Layout locale={locale} onLocaleChange={handleLocaleChange}>
        <Routes>
          <Route path="/" element={<Frontpage locale={locale} />} />
          <Route path="/dashboard" element={<Dashboard locale={locale} />} />
          <Route path="/cv-ptbr" element={<CvPtBr />} />
          <Route path="/cv-en" element={<CvEn />} />
          <Route
            path="/sync-kit"
            element={<OwnerAccessGate locale={locale} />}
          />
          <Route path="/privacidade" element={<Privacy locale={locale} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

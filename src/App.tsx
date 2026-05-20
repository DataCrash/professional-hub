import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  Briefcase,
  ChartNoAxesCombined,
  ClipboardCheck,
  Download,
  ExternalLink,
  Gauge,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'

import { Button } from './components/ui/button'
import {
  captureTrafficSource,
  getAnalyticsSummary,
  getClickBreakdown,
  getRecentAnalyticsEvents,
  trackClick,
  trackPageView,
} from './lib/analytics'
import {
  clearLocalTrackingData,
  getStoredConsentDetails,
  getStoredConsentMode,
  saveConsent,
  type ConsentMode,
} from './lib/consent'

const navigation = [
  { to: '/', label: 'Frontpage' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/cv-ptbr', label: 'CV PT-BR' },
  { to: '/cv-en', label: 'CV EN' },
  { to: '/sync-kit', label: 'Sync Kit' },
  { to: '/privacidade', label: 'Privacidade' },
]

const baseUrl = import.meta.env.BASE_URL
const profileReadmeSnippetPath = `${baseUrl}data/github-profile-readme-snippet.md`
const profileReviewTemplatePath = `${baseUrl}data/profile-sync-review-template.md`

const profile = {
  name: 'Alessandro Ferreira Pereira',
  headlinePt: 'Senior .NET Engineer | Arquitetura de Solucoes | Modernizacao de Plataformas',
  headlineEn: 'Senior .NET Engineer | Solution Architecture | Platform Modernization',
  location: 'Sao Paulo, Brasil',
  company: 'DS3 (alocado na C&A)',
  github: 'https://github.com/datacrash',
  linkedin: 'https://linkedin.com/in/datacrash',
  cvPtBrDownload: `${baseUrl}cv/Senior_DotNet_Engineer_Alessandro_Pereira_BR.pdf`,
  cvEnDownload: `${baseUrl}cv/Senior_DotNet_Engineer_Alessandro_Pereira_EN.pdf`,
}

type GitHubMetrics = {
  profile: {
    username: string
    profileUrl: string
    fetchedAt: string
  }
  totals: {
    repositories: number
    stars: number
    forks: number
    openIssues: number
  }
  languages: Array<{
    name: string
    count: number
  }>
  topRepositories: Array<{
    name: string
    description: string | null
    url: string
    stars: number
    forks: number
    language: string
    updatedAt: string
  }>
}

type ProfileSyncPayload = {
  name: string
  headlinePt: string
  headlineEn: string
  location: string
  currentCompany: string
  githubUrl: string
  linkedinUrl: string
  cvDownloads: {
    ptBr: string
    en: string
  }
  targetRoles: {
    ptBr: string[]
    en: string[]
  }
  notes: {
    usage: string
    humanCheckpointRequired: boolean
  }
}

type ObservedProfileState = {
  githubBio: string
  githubLocation: string
  linkedinHeadline: string
  linkedinLocation: string
  linkedinCompany: string
}

const observedProfileStorageKey = 'profile-sync-observed-v1'

function getDiffStatus(expected: string, observedValue: string) {
  if (!observedValue.trim()) return 'nao avaliado'
  return expected.trim().toLowerCase() === observedValue.trim().toLowerCase() ? 'ok' : 'divergente'
}

function getDiffStatusClasses(status: string) {
  if (status === 'ok') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
  if (status === 'divergente') return 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  return 'border-border/70 bg-background/70 text-muted-foreground'
}

function buildSyncKitDiagnosticMarkdown({
  payload,
  readiness,
  comparisonRows,
}: Readonly<{
  payload: ProfileSyncPayload | null
  readiness: {
    total: number
    ok: number
    divergent: number
    pending: number
    evaluated: number
    completion: number
    readyForCheckpoint: boolean
  }
  comparisonRows: Array<{ label: string; expected: string; observed: string }>
}>) {
  const now = new Date().toISOString()
  const source = payload?.notes.usage ?? 'Sync Kit local snapshot'

  const lines = [
    '# Sync Kit Diagnostic Report',
    '',
    `- Generated at (UTC): ${now}`,
    `- Source: ${source}`,
    `- Ready for checkpoint: ${readiness.readyForCheckpoint ? 'yes' : 'no'}`,
    `- Completion: ${readiness.completion}%`,
    '',
    '## Summary',
    '',
    `- Evaluated: ${readiness.evaluated}/${readiness.total}`,
    `- OK: ${readiness.ok}`,
    `- Divergent: ${readiness.divergent}`,
    `- Pending: ${readiness.pending}`,
    '',
    '## Expected vs Observed',
    '',
  ]

  comparisonRows.forEach((row) => {
    lines.push(
      `- ${row.label}`,
      `  - Expected: ${row.expected || 'n/a'}`,
      `  - Observed: ${row.observed || 'n/a'}`,
    )
  })

  lines.push('', '## Decision', '', '- Reviewer:', '- Decision: approved / needs-adjustments', '- Notes:')

  return `${lines.join('\n')}\n`
}

const fitRolesPt = [
  'Engenheiro de Software Senior (.NET)',
  'Desenvolvedor Backend Senior (.NET)',
  'Engenheiro de Modernizacao de Plataformas',
  'Arquiteto de Solucoes (hands-on)',
  'Tech Lead Backend',
]

const fitRolesEn = [
  'Senior .NET Software Engineer',
  'Senior Backend Engineer (.NET)',
  'Platform Modernization Engineer',
  'Solutions Architect (hands-on)',
  'Backend Tech Lead',
]

function RouteAnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    const path = `${location.pathname}${location.search}`
    trackPageView(path)
    captureTrafficSource(path)
  }, [location.pathname, location.search])

  return null
}

function ConsentBanner() {
  const [mode, setMode] = useState<ConsentMode>(() => getStoredConsentMode())

  if (mode !== 'unset') {
    return null
  }

  return (
    <div className="consent-banner sticky bottom-3 z-20 mt-4 rounded-2xl border p-4 shadow-xl">
      <p className="text-sm text-muted-foreground">
        Coletamos dados anonimos para experiencia basica. Com seu consentimento, registramos eventos
        detalhados e origem de trafego.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            saveConsent('accepted', { analytics: true, traffic: true })
            setMode('accepted')
          }}
        >
          Aceitar tudo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            saveConsent('rejected', { analytics: false, traffic: false })
            setMode('rejected')
          }}
        >
          Recusar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            saveConsent('custom', { analytics: true, traffic: false })
            setMode('custom')
          }}
        >
          Personalizar
        </Button>
      </div>
    </div>
  )
}

// Mouse-tracking spotlight card
function GlowCard({ children, className = '' }: Readonly<{ children: ReactNode; className?: string }>) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--gx', `${e.clientX - rect.left}px`)
    ref.current.style.setProperty('--gy', `${e.clientY - rect.top}px`)
  }, [])

  const handleMouseLeave = useCallback(() => {
    ref.current?.style.setProperty('--gx', '-9999px')
    ref.current?.style.setProperty('--gy', '-9999px')
  }, [])

  return (
    <div
      ref={ref}
      className={`glow-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

// IntersectionObserver scroll reveal
function ScrollReveal({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation()

  useEffect(() => {
    const timer = setTimeout(() => {
      const els = document.querySelectorAll('[data-reveal]')
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed')
              io.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
      )
      els.forEach((el) => io.observe(el))
      return () => io.disconnect()
    }, 60)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return <>{children}</>
}

function Layout({ children }: Readonly<{ children: ReactNode }>) {  return (
    <div className="hub-shell mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8">
      <div className="hub-atmosphere" aria-hidden="true">
        <div className="hub-atmosphere-blob3" />
      </div>
      <header className="hub-header animate-fade-in rounded-3xl border p-4 backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Datacrash Professional Hub
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">Professional Profile Platform</h1>
            <p className="mt-1 text-sm text-muted-foreground">Narrativa tecnica clara para decisao de contratacao</p>
          </div>
          <div className="flex flex-wrap gap-2 md:flex-nowrap">
            <Button asChild variant="outline" size="sm">
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  trackClick('/header', 'github')
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
                  trackClick('/header', 'linkedin')
                }}
              >
                LinkedIn <ArrowUpRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <nav className="hub-nav-shell mt-4">
          <div className="hub-nav flex gap-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                trackClick('/nav', item.label.toLowerCase())
              }}
              className={({ isActive }) =>
                [
                  'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_12px_28px_-18px_hsl(var(--primary))]'
                    : 'border-border/80 bg-background/70 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-secondary',
                ].join(' ')
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
  )
}

function PageCard({
  title,
  description,
  icon,
}: Readonly<{
  title: string
  description: string
  icon: ReactNode
}>) {
  return (
    <GlowCard className="rounded-3xl border p-6">
      <div className="mb-4 inline-flex rounded-2xl border border-border bg-background/90 p-2.5 text-primary">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-muted-foreground">{description}</p>
    </GlowCard>
  )
}

function Frontpage() {
  return (
    <section className="reveal-stagger grid gap-4 md:grid-cols-2">
      <article className="hero-panel animate-fade-in rounded-3xl border p-6 shadow-sm md:col-span-2 md:p-8">
        <div className="hero-grid grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="signal-chip inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Posicionamento Profissional
              </span>
            </div>
            <h2 className="text-gradient-primary mt-4 max-w-4xl text-3xl leading-tight md:text-6xl">
              Hub tecnico para recrutadores e liderancas de engenharia
            </h2>
            <p className="mt-5 max-w-3xl text-muted-foreground md:text-lg">
              Esta frontpage concentra narrativa profissional, acesso ao dashboard tecnico e curriculos em
              dois idiomas. O objetivo e reduzir friccao na avaliacao de fit tecnico e acelerar a tomada de
              decisao para entrevistas.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild>
                <NavLink
                  to="/dashboard"
                  onClick={() => {
                    trackClick('/', 'cta-dashboard')
                  }}
                  className="w-full text-center sm:w-auto"
                >
                  Ver Dashboard
                </NavLink>
              </Button>
              <Button asChild variant="outline" className="bg-background/70">
                <NavLink
                  to="/cv-ptbr"
                  onClick={() => {
                    trackClick('/', 'cta-cv-ptbr')
                  }}
                  className="w-full text-center sm:w-auto"
                >
                  Ler CV PT-BR
                </NavLink>
              </Button>
              <Button asChild variant="outline" className="bg-background/70">
                <NavLink
                  to="/cv-en"
                  onClick={() => {
                    trackClick('/', 'cta-cv-en')
                  }}
                  className="w-full text-center sm:w-auto"
                >
                  Ler CV EN
                </NavLink>
              </Button>
            </div>
          </div>

          <aside className="hero-aside rounded-2xl border border-border/80 bg-background/55 p-4 md:col-span-4 md:p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sinais de prontidao</p>
            <h3 className="mt-2 text-lg font-semibold">Avaliacao tecnica em poucos minutos</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="rounded-lg border border-border/70 bg-background/75 px-3 py-2">
                Contexto de carreira com foco em plataforma e arquitetura
              </li>
              <li className="rounded-lg border border-border/70 bg-background/75 px-3 py-2">
                Evidencias de repositorios e stacks de atuacao
              </li>
              <li className="rounded-lg border border-border/70 bg-background/75 px-3 py-2">
                CV PT-BR e EN com rota de navegacao direta
              </li>
            </ul>
            <div className="kpi-grid mt-4 grid grid-cols-3 gap-2">
              <div className="kpi-card rounded-xl border border-border/80 bg-background/80 p-2 text-center">
                <p className="text-lg font-semibold kpi-value">15+</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Anos</p>
              </div>
              <div className="kpi-card rounded-xl border border-border/80 bg-background/80 p-2 text-center">
                <p className="text-lg font-semibold kpi-value">.NET</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Core</p>
              </div>
              <div className="kpi-card rounded-xl border border-border/80 bg-background/80 p-2 text-center">
                <p className="text-lg font-semibold kpi-value">Hub</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Live</p>
              </div>
            </div>
          </aside>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1">
            GitHub {'->'} Frontpage {'->'} Dashboard {'->'} CV
          </span>
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1">
            Fluxo orientado a decisao tecnica
          </span>
        </div>
      </article>
      <div data-reveal data-delay="1">
      <PageCard
        title="Foco em impacto tecnico"
        description="Arquitetura, modernizacao de plataformas e entrega de software em ambientes enterprise com baixa friccao operacional."
        icon={<Gauge className="h-5 w-5" />}
      />
      </div>
      <div data-reveal data-delay="2">
      <PageCard
        title="Jornada de avaliacao clara"
        description="GitHub -> Frontpage -> Dashboard -> CVs com contexto profissional e evidencias tecnicas no menor numero de cliques."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />
      </div>

      <article data-reveal data-delay="3" className="evidence-strip rounded-3xl border p-6 md:col-span-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Por que esse hub funciona</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <h3 className="text-sm font-semibold">Narrativa objetiva</h3>
            <p className="mt-1 text-sm text-muted-foreground">Informacao priorizada para reduzir ruido na triagem tecnica.</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <h3 className="text-sm font-semibold">Dados verificaveis</h3>
            <p className="mt-1 text-sm text-muted-foreground">Dashboard puxa metricas reais e evidencia tecnologias com clareza.</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <h3 className="text-sm font-semibold">Navegacao curta</h3>
            <p className="mt-1 text-sm text-muted-foreground">Rota direta para CV, portfolio e pontos de contato profissional.</p>
          </div>
        </div>
      </article>
    </section>
  )
}

function Dashboard() {
  const summary = useMemo(
    () => [
      { icon: <User className="h-4 w-4" />, label: profile.name },
      { icon: <MapPin className="h-4 w-4" />, label: profile.location },
      { icon: <Briefcase className="h-4 w-4" />, label: profile.company },
    ],
    [],
  )

  const [githubMetrics, setGithubMetrics] = useState<GitHubMetrics | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadMetrics() {
      try {
        const response = await fetch(`${baseUrl}data/github-metrics.json`, { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as GitHubMetrics
        if (isMounted) {
          setGithubMetrics(data)
        }
      } catch {
        // Keep fallback UI when metrics file is unavailable.
      }
    }

    void loadMetrics()

    return () => {
      isMounted = false
    }
  }, [])

  const dashboardMetrics = useMemo(() => {
    const years = '15+'

    if (!githubMetrics) {
      return [
        { label: 'Repositorios publicos', value: '-', detail: 'Aguardando pipeline de dados GitHub' },
        { label: 'Stars totais', value: '-', detail: 'Aguardando pipeline de dados GitHub' },
        { label: 'Anos de experiencia', value: years, detail: 'Atuacao em ambientes enterprise e legado' },
      ]
    }

    return [
      {
        label: 'Repositorios publicos',
        value: String(githubMetrics.totals.repositories),
        detail: `Atualizado em ${new Date(githubMetrics.profile.fetchedAt).toLocaleString('pt-BR')}`,
      },
      {
        label: 'Stars totais',
        value: String(githubMetrics.totals.stars),
        detail: `${githubMetrics.totals.forks} forks e ${githubMetrics.totals.openIssues} issues abertas`,
      },
      { label: 'Anos de experiencia', value: years, detail: 'Atuacao em ambientes enterprise e legado' },
    ]
  }, [githubMetrics])

  const topLanguageCount = githubMetrics?.languages?.[0]?.count ?? 1
  const topRepoStars = Math.max(...(githubMetrics?.topRepositories?.map((repo) => repo.stars) ?? [1]))

  return (
    <section className="reveal-stagger space-y-4">
      <article className="hero-panel rounded-3xl border p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cabecalho Profissional</p>
        <h2 className="mt-2 text-2xl md:text-3xl">{profile.name}</h2>
        <p className="mt-1 text-muted-foreground">{profile.headlinePt}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {summary.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
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
                trackClick('/dashboard', 'download-cv-ptbr')
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
                trackClick('/dashboard', 'download-cv-en')
              }}
            >
              Download CV EN <Download className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <GlowCard key={metric.label} className="metric-card rounded-3xl border p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</p>
            <h3 className="metric-value mt-2 text-3xl font-semibold">{metric.value}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{metric.detail}</p>
          </GlowCard>
        ))}
      </section>

      <section data-reveal className="grid gap-4 md:grid-cols-2">
        <GlowCard className="spotlight-card rounded-3xl border p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stacks por volume</p>
          <h3 className="mt-2 text-xl font-semibold">Distribuicao por linguagem</h3>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
            {(githubMetrics?.languages?.length ? githubMetrics.languages : [{ name: 'N/A', count: 0 }])
              .slice(0, 6)
              .map((language) => (
                <li key={language.name} className="rounded-xl border border-border/80 bg-background/65 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span>{language.name}</span>
                    <span className="font-semibold text-primary">{language.count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="neon-bar h-2 transition-[width] duration-500"
                      style={{ width: `${Math.max((language.count / topLanguageCount) * 100, 8)}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </GlowCard>
        <GlowCard className="spotlight-card rounded-3xl border p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Top repositorios</p>
          <h3 className="mt-2 text-xl font-semibold">Repositorios em destaque</h3>
          {githubMetrics?.topRepositories?.length ? (
            <ul className="mt-3 space-y-3">
              {githubMetrics.topRepositories.slice(0, 4).map((repo) => (
                <li key={repo.name} className="repo-card rounded-xl border border-border/70 bg-background/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <a
                        className="font-semibold text-primary hover:underline"
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          trackClick('/dashboard', `repo-${repo.name}`)
                        }}
                      >
                        {repo.name}
                      </a>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {repo.description || 'Sem descricao publica.'}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {repo.stars} stars · {repo.forks} forks · {repo.language}
                    </span>
                    <span>{new Date(repo.updatedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="neon-bar-accent h-2 transition-[width] duration-500"
                      style={{ width: `${Math.max((repo.stars / topRepoStars) * 100, 8)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Aguardando dados da pipeline diaria.</p>
          )}
          <ChartNoAxesCombined className="mt-4 h-8 w-8 text-primary" />
        </GlowCard>
      </section>
    </section>
  )
}

function CvPtBr() {
  return (
    <section className="grid gap-4 md:grid-cols-5">
      <article className="md:col-span-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">CV PT-BR</p>
        <h2 className="mt-2 text-3xl">Senior .NET Engineer</h2>
        <p className="mt-3 text-muted-foreground">
          Engenheiro de Software Senior com foco em backend, modernizacao de plataformas e evolucao de
          sistemas criticos em ambientes enterprise.
        </p>
        <div className="mt-5">
          <Button asChild>
            <a
              href={profile.cvPtBrDownload}
              download
              onClick={() => {
                trackClick('/cv-ptbr', 'download-cv-ptbr')
              }}
            >
              Baixar PDF PT-BR <Download className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </article>
      <article className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vagas com fit</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {fitRolesPt.map((role) => (
            <li key={role} className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              {role}
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}

function CvEn() {
  return (
    <section className="grid gap-4 md:grid-cols-5">
      <article className="md:col-span-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resume EN</p>
        <h2 className="mt-2 text-3xl">Senior .NET Software Engineer</h2>
        <p className="mt-3 text-muted-foreground">
          Senior software engineer focused on backend systems, platform modernization and reliable
          delivery in high-complexity enterprise contexts.
        </p>
        <div className="mt-5">
          <Button asChild>
            <a
              href={profile.cvEnDownload}
              download
              onClick={() => {
                trackClick('/cv-en', 'download-cv-en')
              }}
            >
              Download PDF EN <Download className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </article>
      <article className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Target roles</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {fitRolesEn.map((role) => (
            <li key={role} className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              {role}
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}

function Privacy() {
  const [mode, setMode] = useState<ConsentMode>(() => getStoredConsentMode())
  const [analytics, setAnalytics] = useState(() => getStoredConsentDetails().analytics)
  const [traffic, setTraffic] = useState(() => getStoredConsentDetails().traffic)
  const [summary, setSummary] = useState(() => getAnalyticsSummary())

  const recentEvents = getRecentAnalyticsEvents()
  const clickBreakdown = getClickBreakdown()

  function refreshAnalyticsPanel() {
    setSummary(getAnalyticsSummary())
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 inline-flex rounded-xl border border-border bg-background p-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="text-2xl">Privacidade e Cookies</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Coletamos dados anonimos para funcionamento basico. Dados detalhados de analytics e origem de
          trafego so sao salvos com consentimento explicito.
        </p>
        <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-4 text-sm">
          <p>
            <strong>Estado atual de consentimento:</strong> {mode}
          </p>
          <p className="mt-1">Analytics detalhado: {analytics ? 'ativo' : 'desativado'}</p>
          <p>Origem de trafego: {traffic ? 'ativo' : 'desativado'}</p>
          <p className="mt-2">Eventos locais registrados: {summary.totalEvents}</p>
          <p>Page views locais: {summary.pageViews}</p>
          <p>Cliques rastreados localmente: {summary.clicks}</p>
          <p className="mt-2">
            Origem inicial capturada:{' '}
            {summary.trafficSource ? `${summary.trafficSource.referrer} (${summary.trafficSource.utmSource})` : 'nao capturada'}
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Controles</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              saveConsent('accepted', { analytics: true, traffic: true })
              setMode('accepted')
              setAnalytics(true)
              setTraffic(true)
              setSummary(getAnalyticsSummary())
            }}
          >
            Aceitar tudo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              saveConsent('rejected', { analytics: false, traffic: false })
              setMode('rejected')
              setAnalytics(false)
              setTraffic(false)
              setSummary(getAnalyticsSummary())
            }}
          >
            Recusar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              saveConsent('custom', { analytics: true, traffic: false })
              setMode('custom')
              setAnalytics(true)
              setTraffic(false)
              setSummary(getAnalyticsSummary())
            }}
          >
            Personalizar
          </Button>
        </div>
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearLocalTrackingData()
              setMode('unset')
              setAnalytics(false)
              setTraffic(false)
              setSummary(getAnalyticsSummary())
            }}
          >
            Apagar meus dados locais
          </Button>
          <Button variant="outline" size="sm" className="ml-2" onClick={refreshAnalyticsPanel}>
            Atualizar painel
          </Button>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Painel local de inspeção</p>
            <h3 className="mt-2 text-xl font-semibold">Eventos e origem capturados no navegador</h3>
          </div>
          <ChartNoAxesCombined className="h-5 w-5 text-primary" />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">Top cliques</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(clickBreakdown.length ? clickBreakdown : [{ label: 'sem-cliques', count: 0 }]).map((item) => (
                <li key={item.label} className="rounded-lg border border-border/60 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="font-semibold text-primary">{item.count}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">Eventos recentes</h4>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {(recentEvents.length ? recentEvents : [{ type: 'page_view', path: '-', ts: '-', label: '-' }]).map((event, index) => (
                <li key={`${event.ts}-${index}`} className="rounded-lg border border-border/60 px-3 py-2">
                  <p className="font-medium text-foreground">
                    {event.type} · {event.label || event.path}
                  </p>
                  <p className="mt-1">{event.path}</p>
                  <p className="mt-1">{event.ts}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </section>
  )
}

function SyncKit() {
  const [payload, setPayload] = useState<ProfileSyncPayload | null>(null)
  const [observed, setObserved] = useState<ObservedProfileState>({
    githubBio: '',
    githubLocation: '',
    linkedinHeadline: '',
    linkedinLocation: '',
    linkedinCompany: '',
  })

  useEffect(() => {
    const raw = localStorage.getItem(observedProfileStorageKey)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as Partial<ObservedProfileState>
      setObserved((previous) => ({
        ...previous,
        ...parsed,
      }))
    } catch {
      // Ignore malformed local snapshot and keep defaults.
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadPayload() {
      try {
        const response = await fetch(`${baseUrl}data/profile-sync-payload.json`, { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as ProfileSyncPayload
        if (isMounted) {
          setPayload(data)
        }
      } catch {
        // Keep fallback UI when payload file is unavailable.
      }
    }

    void loadPayload()

    return () => {
      isMounted = false
    }
  }, [])

  const githubBio = payload
    ? `${payload.headlineEn} | ${payload.location} | ${payload.currentCompany}`
    : 'Carregando payload de sincronizacao...'

  const linkedinAbout = payload
    ? `I build and modernize enterprise backend platforms with .NET, focusing on reliability, architecture quality, and measurable delivery outcomes.`
    : 'Carregando payload de sincronizacao...'

  const expectedGithubBio = payload
    ? `${payload.headlineEn} | ${payload.location} | ${payload.currentCompany}`
    : ''
  const expectedGithubLocation = payload?.location ?? ''
  const expectedLinkedinHeadline = payload?.headlineEn ?? ''
  const expectedLinkedinLocation = payload?.location ?? ''
  const expectedLinkedinCompany = payload?.currentCompany ?? ''

  const comparisonRows = useMemo(
    () => [
      {
        label: 'GitHub Bio',
        expected: expectedGithubBio,
        observed: observed.githubBio,
      },
      {
        label: 'GitHub Location',
        expected: expectedGithubLocation,
        observed: observed.githubLocation,
      },
      {
        label: 'LinkedIn Headline',
        expected: expectedLinkedinHeadline,
        observed: observed.linkedinHeadline,
      },
      {
        label: 'LinkedIn Location',
        expected: expectedLinkedinLocation,
        observed: observed.linkedinLocation,
      },
      {
        label: 'LinkedIn Company',
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
  )

  const readiness = useMemo(() => {
    let ok = 0
    let divergent = 0
    let pending = 0

    comparisonRows.forEach((row) => {
      const status = getDiffStatus(row.expected, row.observed)
      if (status === 'ok') ok += 1
      if (status === 'divergente') divergent += 1
      if (status === 'nao avaliado') pending += 1
    })

    const total = comparisonRows.length
    const evaluated = total - pending
    const completion = total ? Math.round((evaluated / total) * 100) : 0
    const readyForCheckpoint = pending === 0 && divergent === 0

    return {
      total,
      ok,
      divergent,
      pending,
      evaluated,
      completion,
      readyForCheckpoint,
    }
  }, [comparisonRows])

  const actionableDiffs = useMemo(() => {
    const divergentRows = comparisonRows.filter((row) => getDiffStatus(row.expected, row.observed) === 'divergente')
    const pendingRows = comparisonRows.filter((row) => getDiffStatus(row.expected, row.observed) === 'nao avaliado')

    return {
      divergentRows,
      pendingRows,
    }
  }, [comparisonRows])

  const diagnosticMarkdown = useMemo(
    () => buildSyncKitDiagnosticMarkdown({ payload, readiness, comparisonRows }),
    [payload, readiness, comparisonRows],
  )

  function updateObserved(field: keyof ObservedProfileState, value: string) {
    setObserved((previous) => {
      const next = {
        ...previous,
        [field]: value,
      }
      localStorage.setItem(observedProfileStorageKey, JSON.stringify(next))
      return next
    })
  }

  function clearObservedSnapshot() {
    localStorage.removeItem(observedProfileStorageKey)
    setObserved({
      githubBio: '',
      githubLocation: '',
      linkedinHeadline: '',
      linkedinLocation: '',
      linkedinCompany: '',
    })
  }

  function downloadDiagnosticMarkdown() {
    const blob = new Blob([diagnosticMarkdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    anchor.href = url
    anchor.download = `sync-kit-diagnostic-${stamp}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 inline-flex rounded-xl border border-border bg-background p-2 text-primary">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Integracao Assistida</p>
        <h2 className="mt-2 text-3xl">Sync Kit para GitHub e LinkedIn</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Este painel organiza os dados de perfil em um formato pronto para atualizacao manual com
          checkpoint humano. Nenhuma alteracao e submetida automaticamente em plataformas externas.
        </p>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Snapshot do payload</p>
        {payload ? (
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Nome:</strong> {payload.name}
            </p>
            <p>
              <strong>Localizacao:</strong> {payload.location}
            </p>
            <p>
              <strong>Empresa atual:</strong> {payload.currentCompany}
            </p>
            <p>
              <strong>Checkpoint humano:</strong> {payload.notes.humanCheckpointRequired ? 'obrigatorio' : 'nao'}
            </p>
            <p className="pt-1">
              <strong>Uso:</strong> {payload.notes.usage}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Aguardando leitura de profile-sync-payload.json.</p>
        )}
      </article>

      <article className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Matriz de diferenca</p>
        <h3 className="mt-2 text-xl font-semibold">Esperado vs observado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Preencha os valores atualmente visiveis em GitHub e LinkedIn para validar convergencia antes
          do checkpoint humano de publicacao.
        </p>

        <div className="mt-4 rounded-xl border border-border/70 bg-background/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Resumo de prontidao</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {readiness.evaluated} de {readiness.total} campos avaliados ({readiness.completion}%)
              </p>
            </div>
            <span
              className={[
                'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                readiness.readyForCheckpoint
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300',
              ].join(' ')}
            >
              {readiness.readyForCheckpoint ? 'pronto para checkpoint humano' : 'ainda pendente'}
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
              nao avaliados: {readiness.pending}
            </span>
          </div>

          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={clearObservedSnapshot}>
              Limpar snapshot observado
            </Button>
            <Button variant="outline" size="sm" className="ml-2" onClick={downloadDiagnosticMarkdown}>
              Exportar diagnostico MD <Download className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <h4 className="text-sm font-semibold text-amber-200">Pendencias divergentes</h4>
            {actionableDiffs.divergentRows.length ? (
              <ul className="mt-2 space-y-2 text-xs text-amber-100">
                {actionableDiffs.divergentRows.map((row) => (
                  <li key={`divergent-${row.label}`} className="rounded-lg border border-amber-500/30 bg-background/30 p-2">
                    <p className="font-medium">{row.label}</p>
                    <p className="mt-1">Esperado: {row.expected || 'n/a'}</p>
                    <p>Observado: {row.observed || 'n/a'}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-amber-100/80">Nenhuma divergencia detectada.</p>
            )}
          </section>

          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">Pendencias nao avaliadas</h4>
            {actionableDiffs.pendingRows.length ? (
              <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                {actionableDiffs.pendingRows.map((row) => (
                  <li key={`pending-${row.label}`} className="rounded-lg border border-border/60 bg-background/70 p-2">
                    <p className="font-medium text-foreground">{row.label}</p>
                    <p className="mt-1">Esperado: {row.expected || 'n/a'}</p>
                    <p>Acao: preencher valor observado no formulario.</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Todos os campos ja foram avaliados.</p>
            )}
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">Valores observados (entrada manual)</h4>
            <div className="mt-3 space-y-3 text-sm">
              <label className="block">
                <span className="mb-1 block text-muted-foreground">GitHub Bio</span>
                <input
                  value={observed.githubBio}
                  onChange={(event) => {
                    updateObserved('githubBio', event.target.value)
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a bio atual do GitHub"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-muted-foreground">GitHub Location</span>
                <input
                  value={observed.githubLocation}
                  onChange={(event) => {
                    updateObserved('githubLocation', event.target.value)
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a localizacao atual do GitHub"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-muted-foreground">LinkedIn Headline</span>
                <input
                  value={observed.linkedinHeadline}
                  onChange={(event) => {
                    updateObserved('linkedinHeadline', event.target.value)
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a headline atual do LinkedIn"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-muted-foreground">LinkedIn Location</span>
                <input
                  value={observed.linkedinLocation}
                  onChange={(event) => {
                    updateObserved('linkedinLocation', event.target.value)
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a localizacao atual do LinkedIn"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-muted-foreground">LinkedIn Company</span>
                <input
                  value={observed.linkedinCompany}
                  onChange={(event) => {
                    updateObserved('linkedinCompany', event.target.value)
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Cole a empresa atual do LinkedIn"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h4 className="text-sm font-semibold">Resultado da comparacao</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {comparisonRows.map((row) => {
                const status = getDiffStatus(row.expected, row.observed)
                return (
                  <li key={row.label} className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <p className="font-medium">{row.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Esperado: {row.expected || 'n/a'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Observado: {row.observed || 'n/a'}</p>
                    <span
                      className={[
                        'mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                        getDiffStatusClasses(status),
                      ].join(' ')}
                    >
                      {status}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Checklist rapido</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
            Confirmar headline PT-BR e EN antes de publicar
          </li>
          <li className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
            Confirmar website do GitHub apontando para a frontpage publicada
          </li>
          <li className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
            Confirmar links de CV PT-BR e EN funcionando
          </li>
          <li className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
            Realizar checkpoint humano antes de salvar qualquer alteracao
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a
              href={profileReadmeSnippetPath}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                trackClick('/sync-kit', 'open-readme-snippet')
              }}
            >
              Abrir snippet README
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href={profileReviewTemplatePath}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                trackClick('/sync-kit', 'open-review-template')
              }}
            >
              Abrir template de revisao
            </a>
          </Button>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Textos prontos para uso</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-semibold">Sugestao GitHub Bio</h3>
            <p className="mt-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
              {githubBio}
            </p>
            <a
              href={payload?.githubUrl || profile.github}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
              onClick={() => {
                trackClick('/sync-kit', 'open-github-profile')
              }}
            >
              Abrir GitHub Profile <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </section>

          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-semibold">Sugestao LinkedIn About (EN)</h3>
            <p className="mt-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
              {linkedinAbout}
            </p>
            <a
              href={payload?.linkedinUrl || profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
              onClick={() => {
                trackClick('/sync-kit', 'open-linkedin-profile')
              }}
            >
              Abrir LinkedIn Profile <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-semibold">Roles alvo PT-BR</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {(payload?.targetRoles.ptBr || fitRolesPt).map((role) => (
                <li key={role}>- {role}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-semibold">Target roles EN</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {(payload?.targetRoles.en || fitRolesEn).map((role) => (
                <li key={role}>- {role}</li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </section>
  )
}

function App() {
  return (
    <BrowserRouter basename={baseUrl}>
      <RouteAnalyticsTracker />
      <Layout>
        <Routes>
          <Route path="/" element={<Frontpage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cv-ptbr" element={<CvPtBr />} />
          <Route path="/cv-en" element={<CvEn />} />
          <Route path="/sync-kit" element={<SyncKit />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App

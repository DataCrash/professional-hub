export type NavigationItem = {
  to: string;
  label: string;
};

const baseNavigation: readonly NavigationItem[] = [
  { to: "/", label: "Frontpage" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/cv-ptbr", label: "CV PT-BR" },
  { to: "/cv-en", label: "CV EN" },
  { to: "/privacidade", label: "Privacidade" },
] as const;

export type Locale = "pt-BR" | "en";

export type TrackClickHandler = (path: string, label: string) => void;

export const localeStorageKey = "hub-locale-v1";

export const baseUrl = import.meta.env.BASE_URL;

export const localizedNavigation: Record<Locale, readonly NavigationItem[]> = {
  "pt-BR": baseNavigation,
  en: [
    { to: "/", label: "Frontpage" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/cv-ptbr", label: "CV PT-BR" },
    { to: "/cv-en", label: "CV EN" },
    { to: "/privacidade", label: "Privacy" },
  ],
};

export const profileReadmeSnippetPath = `${baseUrl}data/github-profile-readme-snippet.md`;
export const profileReviewTemplatePath = `${baseUrl}data/profile-sync-review-template.md`;

export const profile = {
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
} as const;

export const ownerAccessStorageKey = "hub-owner-access-v1";
export const observedProfileStorageKey = "profile-sync-observed-v1";

export const cvSummaryPtBrMarkdown = `## Resumo Executivo

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

export const cvSummaryEnMarkdown = `## Executive Summary

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

export const fitRolesPt = [
  "Engenheiro de Software Senior (.NET)",
  "Desenvolvedor Backend Senior (.NET)",
  "Engenheiro de Modernização de Plataformas",
  "Arquiteto de Soluções (hands-on)",
  "Tech Lead Backend",
] as const;

export const fitRolesEn = [
  "Senior .NET Software Engineer",
  "Senior Backend Engineer (.NET)",
  "Platform Modernization Engineer",
  "Solutions Architect (hands-on)",
  "Backend Tech Lead",
] as const;

export const volunteerHighlightsPt = [
  "Chefe Escoteiro - Assistente da Tropa Escoteira",
  "453SP Grupo Escoteiro do Ar Alpha Centauri",
  "Liderança prática, mentoria e formação de jovens",
] as const;

export const volunteerHighlightsEn = [
  "Scout Leader - Assistant of the Scout Troop",
  "453SP Grupo Escoteiro do Ar Alpha Centauri",
  "Hands-on leadership, mentoring and youth development",
] as const;

export const pulseMessagesPt = [
  "Pulso emitido: rota para LinkedIn reforcada.",
  "Sinal ativo: CV PT-BR pronto para download.",
  "Update rapido: novos dados de repositorios em leitura.",
  "Hub online: narrativa tecnica em modo de conversao.",
] as const;

export const pulseMessagesEn = [
  "Pulse emitted: LinkedIn route reinforced.",
  "Signal active: PT-BR CV ready for download.",
  "Quick update: new repository data in read mode.",
  "Hub online: technical narrative in conversion mode.",
] as const;

export type ProfileSyncPayload = {
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

export type ObservedProfileState = {
  githubBio: string;
  githubLocation: string;
  linkedinHeadline: string;
  linkedinLocation: string;
  linkedinCompany: string;
};

export type GitHubMetrics = {
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

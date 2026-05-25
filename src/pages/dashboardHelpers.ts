import type { GitHubMetrics, Locale } from "../content/profileContent";

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export function getDashboardText(locale: Locale) {
  return locale === "pt-BR"
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
}

export function buildDashboardMetrics(
  locale: Locale,
  githubMetrics: GitHubMetrics | null,
): Array<DashboardMetric> {
  const years = "15+";
  const waitingText =
    locale === "pt-BR"
      ? "Aguardando pipeline de dados GitHub"
      : "Waiting for GitHub data pipeline";

  if (!githubMetrics) {
    return [
      {
        label:
          locale === "pt-BR" ? "Repositórios públicos" : "Public repositories",
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
      label: locale === "pt-BR" ? "Anos de experiência" : "Years of experience",
      value: years,
      detail:
        locale === "pt-BR"
          ? "Atuação em ambientes enterprise e legado"
          : "Hands-on delivery in enterprise and legacy environments",
    },
  ];
}

export function getTopLanguageCount(githubMetrics: GitHubMetrics | null) {
  return githubMetrics?.languages?.[0]?.count ?? 1;
}

export function getTopRepoStars(githubMetrics: GitHubMetrics | null) {
  return Math.max(
    ...(githubMetrics?.topRepositories?.map((repo) => repo.stars) ?? [1]),
  );
}

export function getRouletteRepos(githubMetrics: GitHubMetrics | null) {
  return githubMetrics?.topRepositories?.length
    ? githubMetrics.topRepositories.slice(0, 8)
    : [];
}

export function getFreshnessData(githubMetrics: GitHubMetrics | null) {
  const repos = githubMetrics?.topRepositories ?? [];
  const fetchedAtTime = githubMetrics
    ? new Date(githubMetrics.profile.fetchedAt).getTime()
    : 0;

  return repos.slice(0, 4).map((repo) => {
    const days = Math.max(
      1,
      Math.round(
        (fetchedAtTime - new Date(repo.updatedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    return {
      name: repo.name,
      days,
    };
  });
}

import type { Locale } from "../content/profileContent";

export function getFrontpageText(locale: Locale) {
  return locale === "pt-BR"
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
}

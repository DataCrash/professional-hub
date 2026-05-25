import type { Locale } from "../content/profileContent";

export function getPrivacyText(locale: Locale) {
  return locale === "pt-BR"
    ? {
        title: "Privacidade e Consentimento",
        intro:
          "Esta seção trata de dois assuntos distintos: exibição de dados públicos do perfil profissional e coleta de dados de navegação do visitante. Nenhuma identificação pessoal é feita automaticamente.",
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
        acceptAll: "Aceitar tudo",
        reject: "Recusar",
        customize: "Personalizar",
        deleteLocalData: "Apagar meus dados locais",
        refreshPanel: "Atualizar painel",
        localInspection: "Painel local de inspeção",
        browserEvents: "Eventos e origem capturados no navegador",
        topClicks: "Top cliques",
        noClicks: "sem-cliques",
        recentEvents: "Eventos recentes",
      }
    : {
        title: "Privacy and Consent",
        intro:
          "This section covers two separate topics: display of public professional profile data and visitor navigation data collection. No personal identification is performed automatically.",
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
        acceptAll: "Accept all",
        reject: "Reject",
        customize: "Customize",
        deleteLocalData: "Delete my local data",
        refreshPanel: "Refresh panel",
        localInspection: "Local inspection panel",
        browserEvents: "Events and source captured in the browser",
        topClicks: "Top clicks",
        noClicks: "no-clicks",
        recentEvents: "Recent events",
      };
}

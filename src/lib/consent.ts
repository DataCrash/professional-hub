export type ConsentMode = 'accepted' | 'rejected' | 'custom' | 'unset'

export type ConsentDetails = {
  analytics: boolean
  traffic: boolean
}

export function getStoredConsentMode(): ConsentMode {
  const raw = localStorage.getItem('consent.mode') as ConsentMode | null
  return raw ?? 'unset'
}

export function getStoredConsentDetails(): ConsentDetails {
  return {
    analytics: localStorage.getItem('consent.analytics') === 'true',
    traffic: localStorage.getItem('consent.traffic') === 'true',
  }
}

export function saveConsent(mode: Exclude<ConsentMode, 'unset'>, details?: ConsentDetails) {
  localStorage.setItem('consent.mode', mode)

  if (!details) {
    localStorage.removeItem('consent.analytics')
    localStorage.removeItem('consent.traffic')
    return
  }

  localStorage.setItem('consent.analytics', String(details.analytics))
  localStorage.setItem('consent.traffic', String(details.traffic))
}

export function clearLocalTrackingData() {
  localStorage.removeItem('consent.mode')
  localStorage.removeItem('consent.analytics')
  localStorage.removeItem('consent.traffic')
  localStorage.removeItem('analytics.events')
  localStorage.removeItem('analytics.trafficSource')
}

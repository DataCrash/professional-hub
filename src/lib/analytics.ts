import { getStoredConsentDetails } from './consent'

export type AnalyticsEvent = {
  type: 'page_view' | 'click'
  path: string
  label?: string
  ts: string
}

export type TrafficSource = {
  referrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  firstPath: string
  userAgent: string
  language: string
  timezone: string
  capturedAt: string
}

function readEvents(): AnalyticsEvent[] {
  const raw = localStorage.getItem('analytics.events')
  if (!raw) return []

  try {
    return JSON.parse(raw) as AnalyticsEvent[]
  } catch {
    return []
  }
}

function writeEvents(events: AnalyticsEvent[]) {
  localStorage.setItem('analytics.events', JSON.stringify(events.slice(-200)))
}

export function trackPageView(path: string) {
  const consent = getStoredConsentDetails()
  if (!consent.analytics) return

  const events = readEvents()
  events.push({
    type: 'page_view',
    path,
    ts: new Date().toISOString(),
  })

  writeEvents(events)
}

export function trackClick(path: string, label: string) {
  const consent = getStoredConsentDetails()
  if (!consent.analytics) return

  const events = readEvents()
  events.push({
    type: 'click',
    path,
    label,
    ts: new Date().toISOString(),
  })

  writeEvents(events)
}

export function captureTrafficSource(path: string) {
  const consent = getStoredConsentDetails()
  if (!consent.traffic) return

  const existing = localStorage.getItem('analytics.trafficSource')
  if (existing) return

  const params = new URLSearchParams(globalThis.location.search)

  const source: TrafficSource = {
    referrer: document.referrer || 'direct',
    utmSource: params.get('utm_source') || 'none',
    utmMedium: params.get('utm_medium') || 'none',
    utmCampaign: params.get('utm_campaign') || 'none',
    firstPath: path,
    userAgent: globalThis.navigator.userAgent,
    language: globalThis.navigator.language,
    timezone: globalThis.Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    capturedAt: new Date().toISOString(),
  }

  localStorage.setItem('analytics.trafficSource', JSON.stringify(source))
}

export function getAnalyticsSummary() {
  const events = readEvents()
  const trafficRaw = localStorage.getItem('analytics.trafficSource')

  let trafficSource: TrafficSource | null = null

  if (trafficRaw) {
    try {
      trafficSource = JSON.parse(trafficRaw) as TrafficSource
    } catch {
      trafficSource = null
    }
  }

  const pageViews = events.filter((event) => event.type === 'page_view').length
  const clicks = events.filter((event) => event.type === 'click').length

  return {
    totalEvents: events.length,
    pageViews,
    clicks,
    trafficSource,
  }
}

export function getRecentAnalyticsEvents(limit = 12) {
  return readEvents().slice(-limit).reverse()
}

export function getClickBreakdown() {
  const clickEvents = readEvents().filter((event) => event.type === 'click')

  const grouped = clickEvents.reduce<Record<string, number>>((acc, event) => {
    const key = event.label || event.path
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

// Central API client for the Threat Monitoring backend (FastAPI).
// Falls back to bundled mock data if the backend isn't running, so the
// prototype UI is viewable standalone.
import { MOCK_OVERVIEW, MOCK_THREATS, MOCK_ALERTS } from './mockData.js'

const BASE = '/api'

async function safeGet(path, fallback) {
  try {
    const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`[api] falling back to mock data for ${path}:`, e.message)
    return fallback
  }
}

export const api = {
  getOverview: () => safeGet('/overview', MOCK_OVERVIEW),
  getThreats: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return safeGet(`/threats${qs ? `?${qs}` : ''}`, MOCK_THREATS)
  },
  getAlerts: () => safeGet('/alerts', MOCK_ALERTS),
  acknowledgeAlert: async (id) => {
    try {
      const res = await fetch(`${BASE}/alerts/${id}/acknowledge`, { method: 'POST' })
      return await res.json()
    } catch {
      return { id, acknowledged: true }
    }
  },
  performAction: async (threatId, action) => {
    try {
      const res = await fetch(`${BASE}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threat_id: threatId, action }),
      })
      if (!res.ok) throw new Error('action failed')
      return await res.json()
    } catch {
      return {
        success: true,
        threat_id: threatId,
        action,
        message: `${action} executed for ${threatId} (simulated, backend offline).`,
        performed_at: new Date().toISOString(),
      }
    }
  },
}

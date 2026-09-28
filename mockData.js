// Bundled fallback data — mirrors the shape returned by the FastAPI backend
// (see backend/models.py). Used only if /api is unreachable, so the UI
// prototype can be reviewed without running the Python server.

const CATEGORIES = ['Phishing', 'Malware', 'Account Takeover', 'Anomalous Login', 'Data Exfiltration', 'Insider Threat', 'Brute Force', 'Suspicious Link']
const USERS = ['r.sharma', 'a.mehta', 's.iyer', 'k.das', 'p.nair', 'v.singh', 'j.roy', 'n.gupta']
const SOURCES = ['Email Gateway', 'Endpoint Agent', 'Identity Provider', 'Network Sensor', 'Cloud API Log']
const STATUSES = ['New', 'Investigating', 'Contained', 'Resolved']
const LOCATIONS = ['Bhubaneswar, IN', 'Mumbai, IN', 'Lagos, NG', 'Bucharest, RO', 'Hanoi, VN', 'Toronto, CA']

function riskLevel(score) {
  if (score >= 85) return 'Critical'
  if (score >= 65) return 'High'
  if (score >= 40) return 'Medium'
  if (score >= 15) return 'Low'
  return 'Safe'
}

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}
const rnd = seededRandom(7)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

export const MOCK_THREATS = Array.from({ length: 26 }).map((_, i) => {
  const category = pick(CATEGORIES)
  const score = Math.floor(rnd() * 95) + 4
  const level = riskLevel(score)
  const mins = Math.floor(rnd() * 60 * 30) + 1
  return {
    id: `THR-${1000 + i}`,
    title: `${category} activity targeting ${pick(USERS)}`,
    category,
    source: pick(SOURCES),
    target_user: pick(USERS),
    risk_score: score,
    risk_level: level,
    status: pick(STATUSES),
    detected_at: new Date(Date.now() - mins * 60000).toISOString(),
    detection_methods: ['NLP email content analysis', 'Behavioural login pattern analysis'],
    evidence: [
      { signal: 'Suspicious sender domain', detail: 'Domain registered 4 days ago, lookalike of trusted brand', weight: 0.8 },
      { signal: 'Behavioural deviation', detail: 'Access pattern differs from user baseline', weight: 0.6 },
    ],
    recommended_actions: ['Block malicious link', 'Alert administrator'],
    explanation: `Classified as ${level} risk (${score}/100) via ensemble ML/NLP/behavioural analysis.`,
    ip_address: `${Math.floor(rnd()*223)+10}.${Math.floor(rnd()*255)}.${Math.floor(rnd()*255)}.${Math.floor(rnd()*254)+1}`,
    location: pick(LOCATIONS),
  }
}).sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at))

export const MOCK_ALERTS = MOCK_THREATS
  .filter(t => t.risk_level === 'Critical' || t.risk_level === 'High')
  .slice(0, 8)
  .map((t, i) => ({
    id: `ALT-${2000 + i}`,
    threat_id: t.id,
    message: `${t.risk_level} risk ${t.category.toLowerCase()} detected for ${t.target_user} (${t.risk_score}/100)`,
    risk_level: t.risk_level,
    created_at: t.detected_at,
    acknowledged: rnd() < 0.25,
  }))

function counts() {
  const c = { Safe: 0, Low: 0, Medium: 0, High: 0, Critical: 0 }
  MOCK_THREATS.forEach(t => { c[t.risk_level]++ })
  return c
}
const c = counts()

export const MOCK_OVERVIEW = {
  total_threats_24h: MOCK_THREATS.length,
  critical_count: c.Critical,
  high_count: c.High,
  medium_count: c.Medium,
  low_count: c.Low,
  safe_count: c.Safe,
  active_alerts: MOCK_ALERTS.filter(a => !a.acknowledged).length,
  avg_risk_score: Math.round((MOCK_THREATS.reduce((s, t) => s + t.risk_score, 0) / MOCK_THREATS.length) * 10) / 10,
  threats_blocked: 58,
  emails_quarantined: 34,
  sessions_revoked: 12,
  trend_labels: Array.from({ length: 12 }).map((_, i) => `${String((23 - (11 - i)) % 24).padStart(2, '0')}:00`),
  trend_scores: [28, 31, 27, 35, 40, 38, 44, 48, 45, 52, 49, 55],
  category_breakdown: CATEGORIES.reduce((acc, cat) => {
    acc[cat] = MOCK_THREATS.filter(t => t.category === cat).length
    return acc
  }, {}),
}

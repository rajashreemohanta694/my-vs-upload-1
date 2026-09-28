import React, { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Navbar from './components/Navbar.jsx'
import ThreatCards from './components/ThreatCards.jsx'
import RiskScoreCards from './components/RiskScoreCards.jsx'
import { RiskTrendChart, RiskDistributionChart, CategoryBreakdownChart } from './components/Charts.jsx'
import AlertsPanel from './components/AlertsPanel.jsx'
import ThreatTable from './components/ThreatTable.jsx'
import { api } from './api.js'

const RISK_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low', 'Safe']

export default function App() {
  const [active, setActive] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [threats, setThreats] = useState([])
  const [alerts, setAlerts] = useState([])
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const openAlerts = () => setActive('alerts')

    window.addEventListener('open-alerts', openAlerts)

    return () => {
      window.removeEventListener('open-alerts', openAlerts)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [ov, th, al] = await Promise.all([api.getOverview(), api.getThreats(), api.getAlerts()])
      if (cancelled) return
      setOverview(ov)
      setThreats(th)
      setAlerts(al)
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 30000) // poll for "live" feel
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const filteredThreats = useMemo(() => {
    return threats.filter(t => {
      if (riskFilter !== 'All' && t.risk_level !== riskFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !t.target_user.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [threats, riskFilter, search])

  const handleAcknowledge = async (id) => {
    await api.acknowledgeAlert(id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
  }

  const handleAction = async (threatId, action) => {
    return api.performAction(threatId, action)
  }

  return (
    <div className="app-shell">
      <Sidebar active={active} onNavigate={setActive} />

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar
          activeAlerts={overview?.active_alerts || 0}
          onSearch={setSearch}
          searchValue={search}
          active={active}
        />

        <main style={styles.main}>
          {loading ? (
            <div style={styles.loading}>Loading threat intelligence…</div>
          ) : (
            <>
              {active === 'overview' && (
                <>
                  <section style={styles.section}>
                    <ThreatCards overview={overview} />
                  </section>

                  <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Risk scores</h2>
                    <RiskScoreCards overview={overview} />
                  </section>

                  <section style={styles.chartGrid}>
                    <RiskTrendChart overview={overview} />
                    <RiskDistributionChart overview={overview} />
                  </section>

                  <section style={styles.contentGrid}>
                    <div style={styles.leftColumn}>
                      <CategoryBreakdownChart overview={overview} />

                      <div>
                        <div style={styles.filterRow}>
                          <h2 style={styles.sectionTitle}>Recent threats</h2>

                          <div style={styles.chips}>
                            {RISK_FILTERS.map(f => (
                              <button
                                key={f}
                                onClick={() => setRiskFilter(f)}
                                style={{
                                  ...styles.chip,
                                  ...(riskFilter === f ? styles.chipActive : {})
                                }}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>

                        <ThreatTable
                          threats={filteredThreats}
                          onAction={handleAction}
                        />
                      </div>
                    </div>

                    <AlertsPanel
                      alerts={alerts}
                      onAcknowledge={handleAcknowledge}
                    />
                  </section>
                </>
              )}

              {active === 'threats' && (
                <section style={styles.page}>
                  <div style={styles.pageHeader}>
                    <div>
                      <h1 style={styles.pageTitle}>Threat Intelligence</h1>
                      <p style={styles.pageSubtitle}>
                        Monitor, investigate and respond to detected cyber threats.
                      </p>
                    </div>

                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search threats..."
                      style={styles.searchInput}
                    />
                  </div>

                  <div style={styles.filterRow}>
                    <h2 style={styles.sectionTitle}>
                      Detected Threats ({filteredThreats.length})
                    </h2>

                    <div style={styles.chips}>
                      {RISK_FILTERS.map(f => (
                        <button
                          key={f}
                          onClick={() => setRiskFilter(f)}
                          style={{
                            ...styles.chip,
                            ...(riskFilter === f ? styles.chipActive : {})
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ThreatTable
                    threats={filteredThreats}
                    onAction={handleAction}
                  />
                </section>
              )}

              {active === 'alerts' && (
                <section style={styles.page}>
                  <div style={styles.pageHeader}>
                    <div>
                      <h1 style={styles.pageTitle}>Security Alerts</h1>
                      <p style={styles.pageSubtitle}>
                        Review and acknowledge security events requiring attention.
                      </p>
                    </div>

                    <div style={styles.statBadge}>
                      {alerts.filter(a => !a.acknowledged).length} active
                    </div>
                  </div>

                  <AlertsPanel
                    alerts={alerts}
                    onAcknowledge={handleAcknowledge}
                  />
                </section>
              )}

              {active === 'users' && (
                <section style={styles.page}>
                  <div style={styles.pageHeader}>
                    <div>
                      <h1 style={styles.pageTitle}>Identity Monitoring</h1>
                      <p style={styles.pageSubtitle}>
                        Monitor user accounts and suspicious identity activity.
                      </p>
                    </div>
                  </div>

                  <div style={styles.identityGrid}>
                    {[
                      { name: 'Admin Account', role: 'Administrator', risk: 'Low', status: 'Protected' },
                      { name: 'Finance User', role: 'Finance', risk: 'Medium', status: 'Monitoring' },
                      { name: 'Operations User', role: 'Operations', risk: 'Low', status: 'Protected' },
                      { name: 'External User', role: 'External Access', risk: 'High', status: 'Review Required' },
                    ].map((user, index) => (
                      <div key={index} style={styles.identityCard}>
                        <div style={styles.identityAvatar}>
                          {user.name.charAt(0)}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={styles.identityName}>{user.name}</div>
                          <div style={styles.identityRole}>{user.role}</div>
                        </div>

                        <div style={styles.identityRight}>
                          <span style={styles.identityRisk}>{user.risk}</span>
                          <span style={styles.identityStatus}>{user.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={styles.infoPanel}>
                    <h2 style={styles.sectionTitle}>Identity Protection</h2>
                    <p style={styles.infoText}>
                      Sentinel continuously monitors account activity, unusual
                      access patterns and potential credential misuse.
                    </p>

                    <div style={styles.protectionGrid}>
                      <div>
                        <strong>✓</strong> Login anomaly detection
                      </div>
                      <div>
                        <strong>✓</strong> Session monitoring
                      </div>
                      <div>
                        <strong>✓</strong> Suspicious access alerts
                      </div>
                      <div>
                        <strong>✓</strong> Authentication protection
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {active === 'settings' && (
                <section style={styles.page}>
                  <div style={styles.pageHeader}>
                    <div>
                      <h1 style={styles.pageTitle}>System Settings</h1>
                      <p style={styles.pageSubtitle}>
                        Configure Sentinel threat detection and response controls.
                      </p>
                    </div>
                  </div>

                  <div style={styles.settingsList}>
                    <div style={styles.settingCard}>
                      <div>
                        <h3 style={styles.settingTitle}>AI Threat Detection</h3>
                        <p style={styles.settingText}>
                          Automatically classify incoming threats using AI-powered analysis.
                        </p>
                      </div>
                      <span style={styles.enabledBadge}>Enabled</span>
                    </div>

                    <div style={styles.settingCard}>
                      <div>
                        <h3 style={styles.settingTitle}>Behavioural Analytics</h3>
                        <p style={styles.settingText}>
                          Detect unusual activity and anomalous user behaviour.
                        </p>
                      </div>
                      <span style={styles.enabledBadge}>Enabled</span>
                    </div>

                    <div style={styles.settingCard}>
                      <div>
                        <h3 style={styles.settingTitle}>Real-time Monitoring</h3>
                        <p style={styles.settingText}>
                          Continuously monitor threats and refresh intelligence data.
                        </p>
                      </div>
                      <span style={styles.enabledBadge}>Enabled</span>
                    </div>

                    <div style={styles.settingCard}>
                      <div>
                        <h3 style={styles.settingTitle}>Response Automation</h3>
                        <p style={styles.settingText}>
                          Allow recommended response actions for confirmed threats.
                        </p>
                      </div>
                      <span style={styles.enabledBadge}>Prototype</span>
                    </div>
                  </div>

                  <div style={styles.enginePanel}>
                    <div style={styles.engineDot} />
                    <div>
                      <div style={styles.engineTitle}>Detection Engine Online</div>
                      <div style={styles.engineText}>
                        Sentinel monitoring services are operational.
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

const styles = {
  main: {
    padding: '22px 28px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },

  section: {},

  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    margin: '0 0 12px',
  },

  loading: {
    color: 'var(--text-faint)',
    fontSize: 13,
    padding: '60px 0',
    textAlign: 'center',
  },

  chartGrid: {
    display: 'grid',
    gridTemplateColumns: '1.3fr 1fr',
    gap: 14,
  },

  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 14,
    alignItems: 'start',
  },

  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },

  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },

  chips: {
    display: 'flex',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },

  chip: {
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    color: 'var(--text-dim)',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 11.5,
    cursor: 'pointer',
  },

  chipActive: {
    background: 'var(--panel-2)',
    color: 'var(--text)',
    borderColor: 'var(--accent)',
  },

  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
  },

  pageTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },

  pageSubtitle: {
    margin: '6px 0 0',
    color: 'var(--text-faint)',
    fontSize: 12.5,
  },

  searchInput: {
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 7,
    padding: '9px 12px',
    width: 220,
    outline: 'none',
    fontSize: 12,
  },

  statBadge: {
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    color: 'var(--accent)',
    borderRadius: 7,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
  },

  identityGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },

  identityCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--panel)',
    border: '1px solid var(--border-soft)',
    borderRadius: 10,
    padding: 16,
  },

  identityAvatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'var(--panel-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--accent)',
    fontWeight: 700,
    fontSize: 14,
  },

  identityName: {
    fontSize: 13,
    fontWeight: 600,
  },

  identityRole: {
    marginTop: 3,
    fontSize: 11,
    color: 'var(--text-faint)',
  },

  identityRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 5,
  },

  identityRisk: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--accent)',
  },

  identityStatus: {
    fontSize: 10,
    color: 'var(--text-faint)',
  },

  infoPanel: {
    background: 'var(--panel)',
    border: '1px solid var(--border-soft)',
    borderRadius: 10,
    padding: 18,
  },

  infoText: {
    color: 'var(--text-dim)',
    fontSize: 12,
    lineHeight: 1.6,
    margin: '0 0 16px',
  },

  protectionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    color: 'var(--text-dim)',
    fontSize: 11.5,
  },

  settingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  settingCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    background: 'var(--panel)',
    border: '1px solid var(--border-soft)',
    borderRadius: 10,
    padding: 18,
  },

  settingTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
  },

  settingText: {
    margin: '5px 0 0',
    color: 'var(--text-faint)',
    fontSize: 11.5,
    lineHeight: 1.5,
  },

  enabledBadge: {
    whiteSpace: 'nowrap',
    background: 'rgba(63,208,201,0.1)',
    color: 'var(--safe)',
    border: '1px solid rgba(63,208,201,0.25)',
    borderRadius: 6,
    padding: '5px 9px',
    fontSize: 10.5,
    fontWeight: 600,
  },

  enginePanel: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--panel-2)',
    border: '1px solid var(--border-soft)',
    borderRadius: 10,
    padding: 16,
  },

  engineDot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: 'var(--safe)',
    boxShadow: '0 0 0 4px rgba(63,208,201,0.12)',
  },

  engineTitle: {
    fontSize: 12.5,
    fontWeight: 600,
  },

  engineText: {
    marginTop: 3,
    color: 'var(--text-faint)',
    fontSize: 10.5,
  },
}

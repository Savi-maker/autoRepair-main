import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../utils/useAuth'
import {
  logout,
  getOrders,
  getAppointments,
  getLowStockParts,
  getInvoices,
  getThreads,
  getNotifications,
} from '../../utils/api'
import './Dashboard.css'

type KpiTone = 'ok' | 'warn' | 'bad'

type KPI = {
  title: string
  value: string
  hint: string
  tone?: KpiTone
  onClick?: () => void
}

type ActivityItem = {
  id: string
  ts: string
  text: string
  kind: 'order' | 'stock' | 'invoice' | 'calendar' | 'message' | 'notification'
  onClick?: () => void
}

type UpcomingAppointment = {
  vehicle: string
  service: string
  date: string
  mechanic: string
  status: string
}

function isoToLocalShort(isoLike: string) {
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return isoLike
  return d.toLocaleString()
}

function timeAgo(isoLike: string) {
  const d = new Date(isoLike)
  const t = d.getTime()
  if (Number.isNaN(t)) return isoLike

  const diff = Date.now() - t
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s temu`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min temu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} godz. temu`
  const days = Math.floor(hr / 24)
  return `${days} dni temu`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [loadingLogout, setLoadingLogout] = useState(false)


  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [orders, setOrders] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [threads, setThreads] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  const handleLogout = async () => {
    setLoadingLogout(true)
    await logout()
    navigate('/login')
  }

  const menuItems = [
    { path: '/UserProfileScreen', label: '👤 Profil', permission: null as any },
    { path: '/zlecenia', label: '🧾 Zlecenia', permission: 'canViewOrders' as any },
    { path: '/pojazdy', label: '🚗 Pojazdy', permission: 'canViewVehicles' as any },
    { path: '/klienci', label: '👥 Klienci', permission: 'canViewCustomers' as any },
    { path: '/kalendarz', label: '📅 Kalendarz', permission: 'canViewAppointments' as any },
    { path: '/magazyn', label: '📦 Magazyn', permission: 'canViewWarehouse' as any },
    { path: '/faktury', label: '🧾 Faktury', permission: 'canViewInvoices' as any },
    { path: '/wiadomosci', label: '💬 Wiadomości', permission: 'canViewMessages' as any },
    { path: '/ai', label: '🤖 AI', permission: 'canViewAiHelper' as any },
    { path: '/search', label: '🔍 Szukaj', permission: null as any },
    { path: '/settings', label: '⚙️ Ustawienia', permission: null as any },
    { path: '/admin/uzytkownicy', label: '👑 Admin', permission: 'canViewAdminPanel' as any },
  ]


  const filteredMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoadingData(true)
      setError(null)

      const withTimeout = (promise: any, ms: number) =>
        Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ])

      try {
        const [o, a, ls, inv, th, n] = await Promise.allSettled([
          withTimeout(getOrders(), 10000),
          withTimeout(getAppointments(), 10000),
          withTimeout(getLowStockParts(), 10000),
          withTimeout(getInvoices(), 10000),
          withTimeout(getThreads(), 10000),
          withTimeout(getNotifications(), 10000),
        ])

        if (!alive) return

        setOrders(o.status === 'fulfilled' && o.value?.success ? o.value.data || [] : [])
        setAppointments(a.status === 'fulfilled' && a.value?.success ? a.value.data || [] : [])
        setLowStock(ls.status === 'fulfilled' && ls.value?.success ? ls.value.data || [] : [])
        setInvoices(inv.status === 'fulfilled' && inv.value?.success ? inv.value.data || [] : [])
        setThreads(th.status === 'fulfilled' && th.value?.success ? th.value.data || [] : [])
        setNotifications(n.status === 'fulfilled' && n.value?.success ? n.value.data || [] : [])

        const errors = [o, a, ls, inv, th, n].filter(r => r.status === 'rejected')
        if (errors.length > 0) {
          console.warn('Některé data se nepodařily načíst:', errors)
        }
      } catch (err: any) {
        if (alive) {
          setError('Chyba při načítání dat')
        }
      } finally {
        if (alive) setLoadingData(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [])

  const upcomingAppointment: UpcomingAppointment = useMemo(() => {
    const now = new Date()

    const future = (appointments || [])
      .filter((x) => x?.start_at)
      .map((x) => ({ ...x, _d: new Date(x.start_at) }))
      .filter((x) => !Number.isNaN(x._d.getTime()) && x._d.getTime() >= now.getTime())
      .sort((a, b) => a._d.getTime() - b._d.getTime())

    const first = future[0]
    if (!first) {
      return {
        vehicle: '—',
        service: 'Brak zaplanowanych wizyt',
        date: '—',
        mechanic: '—',
        status: 'Brak',
      }
    }


    const vehicleLabel = first?.vehicle_label || (first?.vehicle_id ? `Pojazd #${first.vehicle_id}` : '—')
    const serviceLabel = first?.service || first?.title || 'Wizyta'
    const mechanicLabel = first?.mechanic_name || (first?.mechanic_user_id ? `Mechanik #${first.mechanic_user_id}` : '—')

    return {
      vehicle: vehicleLabel,
      service: serviceLabel,
      date: isoToLocalShort(first.start_at),
      mechanic: mechanicLabel,
      status: first.status || 'zaplanowana',
    }
  }, [appointments])

  const kpis: KPI[] = useMemo(() => {
    const now = new Date()

    const ordersToday = (orders || []).filter((o) => {
      const base = o?.start_at || o?.created_at
      if (!base) return false
      const d = new Date(base)
      if (Number.isNaN(d.getTime())) return false
      return sameDay(d, now)
    }).length

    const inProgress = (orders || []).filter((o) => String(o?.status) === 'w_trakcie').length

    const low = (lowStock || []).length

    const pending = (invoices || []).filter((i) => String(i?.status) === 'oczekuje').length
    const overdue = (invoices || []).filter((i) => {
      if (!i?.due_date) return false
      const due = new Date(i.due_date)
      if (Number.isNaN(due.getTime())) return false
      return String(i?.status) !== 'zaplacona' && due.getTime() < now.getTime()
    }).length

    const toneOrders: KpiTone = ordersToday >= 8 ? 'warn' : 'ok'
    const toneProgress: KpiTone = inProgress >= 5 ? 'warn' : inProgress >= 2 ? 'ok' : 'ok'
    const toneStock: KpiTone = low >= 3 ? 'bad' : low >= 1 ? 'warn' : 'ok'
    const toneInvoices: KpiTone = overdue >= 1 ? 'bad' : pending >= 4 ? 'warn' : 'ok'

    return [
      {
        title: 'Zlecenia dziś',
        value: String(ordersToday),
        hint: 'wg start_at / created_at',
        tone: toneOrders,
        onClick: () => navigate('/zlecenia'),
      },
      {
        title: 'W trakcie',
        value: String(inProgress),
        hint: 'status: w_trakcie',
        tone: toneProgress,
        onClick: () => navigate('/zlecenia'),
      },
      {
        title: 'Braki magazynowe',
        value: String(low),
        hint: low ? 'min_stock przekroczony' : 'brak alertów',
        tone: toneStock,
        onClick: () => navigate('/magazyn'),
      },
      {
        title: 'Faktury oczekujące',
        value: String(pending),
        hint: overdue ? `${overdue} przetermin.` : 'bez zaległości',
        tone: toneInvoices,
        onClick: () => navigate('/faktury'),
      },
    ]
  }, [orders, lowStock, invoices, navigate])

  const activity: ActivityItem[] = useMemo(() => {
    const items: { tsIso: string; item: ActivityItem }[] = []


    ;(orders || [])
      .slice()
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 2)
      .forEach((o) => {
        const tsIso = o.created_at || o.start_at || new Date().toISOString()
        items.push({
          tsIso,
          item: {
            id: `order-${o.id}`,
            ts: timeAgo(tsIso),
            kind: 'order',
            text: `Zlecenie #${o.id} → status: ${o.status}`,
            onClick: () => navigate('/zlecenia'),
          },
        })
      })


    ;(lowStock || []).slice(0, 1).forEach((p) => {
      const tsIso = p.created_at || new Date().toISOString()
      items.push({
        tsIso,
        item: {
          id: `stock-${p.id}`,
          ts: 'alert',
          kind: 'stock',
          text: `Magazyn: ${p.name} poniżej minimum`,
          onClick: () => navigate('/magazyn'),
        },
      })
    })


    ;(invoices || [])
      .slice()
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 1)
      .forEach((i) => {
        const tsIso = i.created_at || new Date().toISOString()
        items.push({
          tsIso,
          item: {
            id: `inv-${i.id}`,
            ts: timeAgo(tsIso),
            kind: 'invoice',
            text: `Faktura ${i.number} → ${i.status}`,
            onClick: () => navigate('/faktury'),
          },
        })
      })


    ;(appointments || [])
      .slice()
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 1)
      .forEach((a) => {
        const tsIso = a.created_at || a.start_at || new Date().toISOString()
        items.push({
          tsIso,
          item: {
            id: `appt-${a.id}`,
            ts: timeAgo(tsIso),
            kind: 'calendar',
            text: `Wizyta: ${a.title} (${isoToLocalShort(a.start_at)})`,
            onClick: () => navigate('/kalendarz'),
          },
        })
      })


    ;(threads || [])
      .slice()
      .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
      .slice(0, 1)
      .forEach((t) => {
        const tsIso = t.updated_at || t.created_at || new Date().toISOString()
        items.push({
          tsIso,
          item: {
            id: `msg-${t.id}`,
            ts: timeAgo(tsIso),
            kind: 'message',
            text: `Wiadomości: ${t.title}`,
            onClick: () => navigate('/wiadomosci'),
          },
        })
      })


    const unread = (notifications || []).filter((n) => !n.read_at)
    if (unread.length) {
      items.push({
        tsIso: unread[0].created_at || new Date().toISOString(),
        item: {
          id: `notif-${unread[0].id}`,
          ts: timeAgo(unread[0].created_at || new Date().toISOString()),
          kind: 'notification',
          text: `🔔 ${unread.length} nowych powiadomień`,
          onClick: () => navigate('/notifications'),
        },
      })
    }

    return items
      .sort((a, b) => new Date(b.tsIso).getTime() - new Date(a.tsIso).getTime())
      .slice(0, 5)
      .map((x) => x.item)
  }, [orders, lowStock, invoices, appointments, threads, notifications, navigate])

  const alertList = useMemo(() => {
    const list: string[] = []

    const low = (lowStock || []).length
    if (low > 0) list.push(`Braki w magazynie: ${low} pozycji`)

    const now = new Date()
    const overdue = (invoices || []).filter((i) => {
      if (!i?.due_date) return false
      const due = new Date(i.due_date)
      if (Number.isNaN(due.getTime())) return false
      return String(i?.status) !== 'zaplacona' && due.getTime() < now.getTime()
    }).length
    if (overdue > 0) list.push(`${overdue} faktura/y przeterminowana/e`)

    const toConfirm = (appointments || []).filter((a) => String(a?.status) === 'do_potwierdzenia').length
    if (toConfirm > 0) list.push(`${toConfirm} wizyty do potwierdzenia`)

    if (!list.length) list.push('Brak krytycznych alertów 🎉')
    return list
  }, [lowStock, invoices, appointments])

  const toneClass = (tone?: KpiTone) => {
    if (tone === 'ok') return 'kpi ok'
    if (tone === 'warn') return 'kpi warn'
    if (tone === 'bad') return 'kpi bad'
    return 'kpi'
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🔧 AutoRepair</h1>
        <button onClick={handleLogout} disabled={loadingLogout} className="btn-logout">
          {loadingLogout ? 'Wylogowywanie...' : 'Wyloguj'}
        </button>
      </header>

      <div className="top-menu-bar">
        {filteredMenuItems.map((item) => (
          <button key={item.path} onClick={() => navigate(item.path)} className="top-menu-card">
            <div className="menu-icon">{item.label.split(' ')[0]}</div>
            <div className="top-menu-label">{item.label.split(' ').slice(1).join(' ')}</div>
          </button>
        ))}
      </div>

      <main className="dashboard-main">
        <section className="welcome-section">
          <h2>Witaj w systemie!</h2>
          <p>Twój panel dnia: zlecenia, wizyty, alerty i aktywność.</p>
          {loadingData && <p style={{ opacity: 0.85, marginTop: 10 }}>⏳ Ładowanie danych…</p>}
          {!loadingData && error && <p style={{ color: '#ffb3b3', marginTop: 10 }}>⚠️ {error}</p>}
        </section>

        {/* KPI */}
        <section className="kpi-grid">
          {kpis.map((k) => (
            <button key={k.title} className={toneClass(k.tone)} onClick={k.onClick}>
              <div className="kpi-title">{k.title}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-hint">{k.hint}</div>
            </button>
          ))}
        </section>

        {/* DÓŁ */}
        <section className="dashboard-grid">
          <div className="panel panel-wide">
            <div className="panel-header">
              <h3>Następna wizyta</h3>
              <span className="status">{upcomingAppointment.status}</span>
            </div>

            <div className="appointment-body">
              <p><strong>Pojazd:</strong> {upcomingAppointment.vehicle}</p>
              <p><strong>Usługa:</strong> {upcomingAppointment.service}</p>
              <p><strong>Data:</strong> {upcomingAppointment.date}</p>
              <p><strong>Mechanik:</strong> {upcomingAppointment.mechanic}</p>
            </div>

            <div className="panel-actions">
              <button className="btn-primary" onClick={() => navigate('/kalendarz')}>Umów nową wizytę</button>
              <button className="btn-secondary" onClick={() => navigate('/zlecenia')}>Szczegóły</button>
            </div>

            <div className="quick-actions">
              <button className="btn-secondary" onClick={() => navigate('/search')}>🔍 Szybkie wyszukiwanie</button>
              <button className="btn-secondary" onClick={() => navigate('/wiadomosci')}>💬 Wiadomości</button>
              <button className="btn-secondary" onClick={() => navigate('/magazyn')}>📦 Magazyn</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Ostatnia aktywność</h3>
              <button className="btn-secondary" onClick={() => navigate('/wiadomosci')}>Wiadomości</button>
            </div>

            <div className="feed">
              {activity.map((a) => (
                <button key={a.id} className="feed-item" onClick={a.onClick}>
                  <span className={`dot ${a.kind}`} />
                  <div className="feed-main">
                    <div className="feed-text">{a.text}</div>
                    <div className="feed-ts">{a.ts}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="panel-actions">
              <button className="btn-secondary" onClick={() => navigate('/magazyn')}>Sprawdź magazyn</button>
              <button className="btn-secondary" onClick={() => navigate('/faktury')}>Faktury</button>
            </div>

            <div className="alert-box">
              <div className="alert-title">⚠️ Alerty</div>
              <ul className="alert-list">
                {alertList.map((x, idx) => (
                  <li key={idx}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>© 2025 AutoRepair</p>
      </footer>
    </div>
  )
}

export default Dashboard

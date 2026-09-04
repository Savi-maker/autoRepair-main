import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationType,
} from '../../utils/api'
import './Notifications.css'

function formatDate(v: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString()
}

export default function Notifications() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<NotificationType[]>([])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [busyAll, setBusyAll] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await getNotifications()
      if (!resp.success) {
        setError(resp.message || 'Nie udało się pobrać powiadomień')
        setLoading(false)
        return
      }
      setItems(resp.data || [])
      setLoading(false)
    } catch (e: any) {
      setError(e?.message || 'Network error')
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const unreadCount = useMemo(() => items.filter((x) => !x.read_at).length, [items])

  const onMarkRead = async (n: NotificationType) => {
    if (n.read_at) return
    setBusyId(n.id)

    const prev = items
    setItems((curr) =>
      curr.map((x) =>
        x.id === n.id
          ? {
              ...x,
              read_at: new Date().toISOString(),
            }
          : x
      )
    )

    const resp = await markNotificationRead(n.id)
    setBusyId(null)
    if (!resp.success) {
      setItems(prev)
      alert(resp.message || 'Nie udało się oznaczyć jako przeczytane')
    }
  }

  const onMarkAll = async () => {
    if (unreadCount === 0) return
    setBusyAll(true)

    const prev = items
    const nowIso = new Date().toISOString()
    setItems((curr) => curr.map((x) => (x.read_at ? x : { ...x, read_at: nowIso })))

    const resp = await markAllNotificationsRead()
    setBusyAll(false)
    if (!resp.success) {
      setItems(prev)
      alert(resp.message || 'Nie udało się oznaczyć wszystkich')
    }
  }

  const onDelete = async (n: NotificationType) => {
    const ok = window.confirm('Usunąć powiadomienie?')
    if (!ok) return

    const prev = items
    setItems((curr) => curr.filter((x) => x.id !== n.id))

    const resp = await deleteNotification(n.id)
    if (!resp.success) {
      setItems(prev)
      alert(resp.message || 'Nie udało się usunąć powiadomienia')
    }
  }

  return (
    <div className="notif-container">
      <div className="notif-header">
        <AppButton variant="back" onClick={() => navigate(-1)}>
          ← Wróć
        </AppButton>
        <h1>Powiadomienia</h1>
        <div className="notif-actions">
          <button className="notif-btn secondary" onClick={load} disabled={loading}>
            Odśwież
          </button>
          <button className="notif-btn primary" onClick={onMarkAll} disabled={busyAll || unreadCount === 0}>
            {busyAll ? 'Oznaczanie…' : `Oznacz wszystkie (${unreadCount})`}
          </button>
        </div>
      </div>

      {loading && <div className="notif-message">⏳ Ładowanie…</div>}
      {error && <div className="notif-message error">⚠️ {error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="notif-empty">Brak powiadomień.</div>
      )}

      <div className="notif-list">
        {items.map((n) => {
          const unread = !n.read_at
          return (
            <div key={n.id} className={`notif-card ${unread ? 'unread' : ''}`}>
              <div className="notif-card-top">
                <div className="notif-title">{n.title}</div>
                <div className={`notif-badge ${unread ? 'new' : 'read'}`}>{unread ? 'Nowe' : 'Przeczytane'}</div>
              </div>

              <div className="notif-body">{n.body || '—'}</div>

              <div className="notif-meta">
                <span>Dodano: {formatDate(n.created_at)}</span>
                <span>Przeczytano: {formatDate(n.read_at)}</span>
              </div>

              <div className="notif-row-actions">
                <button
                  className="notif-btn secondary"
                  onClick={() => onMarkRead(n)}
                  disabled={!unread || busyId === n.id}
                >
                  {busyId === n.id ? 'Zapisywanie…' : 'Oznacz jako przeczytane'}
                </button>
                <button className="notif-btn danger" onClick={() => onDelete(n)}>
                  Usuń
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

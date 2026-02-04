import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import './Kalendarz.css'
import { useAuth } from '../../utils/useAuth'
import {
  getAppointments,
  getVehicles,
  getCustomers,
  createAppointment,
  type AppointmentType,
  type VehicleType,
  type CustomerType,
} from '../../utils/api'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Kalendarz() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selected, setSelected] = useState<string>(toISODate(new Date()))

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [appointments, setAppointments] = useState<AppointmentType[]>([])
  const [vehicles, setVehicles] = useState<VehicleType[]>([])
  const [customers, setCustomers] = useState<CustomerType[]>([])
  const [appointmentPagination, setAppointmentPagination] = useState<any>({ page: 1, limit: 50, total: 0, totalPages: 1 })
  const [appointmentPage, setAppointmentPage] = useState(1)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [vehicleId, setVehicleId] = useState<number | ''>('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setTitle('')
    setCustomerId('')
    setVehicleId('')
    setStartAt('')
    setEndAt('')
    setNotes('')
    setFormError(null)
  }

  const closeModal = () => {
    setOpen(false)
    resetForm()
  }

  const reloadAll = async (page: number = 1) => {
    setLoading(true)
    setError(null)

    const results = await Promise.allSettled([
      getAppointments(page, 50),
      getVehicles(),
      getCustomers(),
    ])

    const [aRes, vRes, cRes] = results

    if (aRes.status === 'fulfilled' && aRes.value.success) {
      setAppointments(aRes.value.data || [])
      if (aRes.value.pagination) {
        setAppointmentPagination(aRes.value.pagination)
      }
    }
    if (vRes.status === 'fulfilled' && vRes.value.success) {
      setVehicles(vRes.value.data || [])
    }
    if (cRes.status === 'fulfilled' && cRes.value.success) {
      setCustomers(cRes.value.data || [])
    }

    const hasError = results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
    if (hasError) {
      const failedLoads = []
      if (aRes.status === 'rejected' || (aRes.status === 'fulfilled' && !aRes.value.success)) failedLoads.push('wizyty')
      if (vRes.status === 'rejected' || (vRes.status === 'fulfilled' && !vRes.value.success)) failedLoads.push('pojazdy')
      if (cRes.status === 'rejected' || (cRes.status === 'fulfilled' && !cRes.value.success)) failedLoads.push('klienci')
      setError(`Błąd pobierania: ${failedLoads.join(', ')}`)
    }

    setLoading(false)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      await reloadAll(appointmentPage)
      if (!alive) return
    })()
    return () => {
      alive = false
    }
  }, [appointmentPage])

  const days = useMemo(() => {
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    const arr: Date[] = []
    for (let i = -3; i <= 10; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [])

  const filteredCustomers = useMemo(() => {
    if (user && (user.rola === 'klient' || user.rola === 'user') && user.customer_id) {
      return customers.filter((c) => c.id === user.customer_id)
    }
    return customers
  }, [customers, user])

  const vehiclesForCustomer = useMemo(() => {
    if (!customerId) return []
    let vList = vehicles.filter((v) => v.customer_id === Number(customerId))
    if (user && (user.rola === 'klient' || user.rola === 'user') && user.customer_id) {
      vList = vList.filter((v) => v.customer_id === user.customer_id)
    }
    return vList
  }, [vehicles, customerId, user])

  useEffect(() => {
    if (user && (user.rola === 'klient' || user.rola === 'user') && user.customer_id && !customerId) {
      setCustomerId(user.customer_id)
    }
  }, [user])

  useEffect(() => {
    if (!customerId) {
      setVehicleId('')
      return
    }
    if (vehicleId) {
      const v = vehicles.find((x) => x.id === Number(vehicleId))
      if (!v || v.customer_id !== Number(customerId)) setVehicleId('')
    }
  }, [customerId])

  const dayVisits = useMemo(() => {
    let filtered = (appointments || [])
      .filter((v) => String(v.start_at || '').slice(0, 10) === selected)
      .sort((a, b) => String(a.start_at || '').localeCompare(String(b.start_at || '')))
    
    if (user && (user.rola === 'klient' || user.rola === 'user') && user.customer_id) {
      filtered = filtered.filter((a) => a.customer_id === user.customer_id)
    }
    
    return filtered
  }, [appointments, selected, user])

  const submitCreate = async () => {
    setFormError(null)

    const t = title.trim()
    if (!t) return setFormError('Uzupełnij pole: Tytuł')
    if (!startAt) return setFormError('Uzupełnij pole: Start')
    
    const isKlient = user && (user.rola === 'klient' || user.rola === 'user')
    const effectiveCustomerId = isKlient && user.customer_id ? user.customer_id : customerId
    
    if (!effectiveCustomerId) return setFormError('Wybierz klienta')
    if (!vehicleId) return setFormError('Wybierz pojazd')

    const startIso = startAt ? new Date(startAt).toISOString() : undefined
    const endIso = endAt ? new Date(endAt).toISOString() : undefined

    if (startIso && endIso) {
      const a = new Date(startIso).getTime()
      const b = new Date(endIso).getTime()
      if (!Number.isNaN(a) && !Number.isNaN(b) && b < a) {
        return setFormError('Data zakończenia nie może być wcześniejsza niż rozpoczęcia')
      }
    }

    setSaving(true)
    const resp = await createAppointment({
      title: t,
      start_at: startIso,
      end_at: endIso,
      status: 'oczekujacy',
      customer_id: Number(effectiveCustomerId),
      vehicle_id: Number(vehicleId),
      order_id: undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    })
    setSaving(false)

    if (!resp.success) {
      setFormError(resp.message || 'Nie udało się utworzyć wizyty')
      return
    }

    closeModal()
    await reloadAll()
  }

  return (
    <div className="kalendarz-container">
      <div className="kalendarz-header">
        <AppButton variant="back" onClick={() => navigate(-1)}>
          ← Wróć
        </AppButton>
        <h1>Kalendarz</h1>
        <div className="k-actions">
          <button className="k-btn-primary" onClick={() => setOpen(true)}>
            Umów wizytę
          </button>
        </div>
      </div>

      <div className="calendar-strip">
        {days.map((d) => {
          const dayISO = toISODate(d)
          const isActive = dayISO === selected
          const label = d.toLocaleDateString(undefined, {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
          })
          return (
            <button
              key={dayISO}
              className={`day-chip ${isActive ? 'active' : ''}`}
              onClick={() => setSelected(dayISO)}
            >
              {label}
            </button>
          )
        })}
      </div>

      {loading && <div style={{ opacity: 0.85, padding: 12 }}>⏳ Ładowanie…</div>}
      {!loading && error && <div style={{ color: '#ffb3b3', padding: 12 }}>⚠️ {error}</div>}

      <div className="kalendarz-grid">
        {!loading && !error && dayVisits.length === 0 ? (
          <div className="empty-card">Brak wizyt w tym dniu. Kliknij „Umów wizytę”, aby dodać nową.</div>
        ) : (
          dayVisits.map((v) => {
            const veh = vehicles.find((x) => x.id === v.vehicle_id)
            const cust = customers.find((x) => x.id === v.customer_id)

            const timeLabel = v.start_at
              ? new Date(String(v.start_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'

            return (
              <div key={v.id} className="visit-card">
                <div className="visit-top">
                  <div className="time">{timeLabel}</div>
                  <div className="title">{v.title}</div>
                </div>

                <div className="meta">
                  <b>Pojazd:</b>{' '}
                  {veh
                    ? `${veh.make} ${veh.model} ${veh.year ?? ''} — ${veh.plate}`.trim()
                    : `Pojazd #${v.vehicle_id ?? '—'}`}
                </div>
                <div className="meta">
                  <b>Klient:</b> {cust?.name ?? (v.customer_id ? `Klient #${v.customer_id}` : '—')}
                </div>

                <div className="card-actions">
                  <button className="btn-secondary">Szczegóły</button>
                  <button className="btn-secondary">Przełóż</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {appointmentPagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center', 
          padding: '16px 0',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => setAppointmentPage(p => Math.max(1, p - 1))}
            disabled={appointmentPage === 1}
            style={{
              padding: '8px 16px',
              background: appointmentPage === 1 ? '#555' : '#ff6600',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: appointmentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: appointmentPage === 1 ? 0.5 : 1,
            }}
          >
            ← Poprzednia
          </button>
          <span style={{ color: '#ccc', fontSize: '14px' }}>
            Strona <b>{appointmentPage}</b> z <b>{appointmentPagination.totalPages}</b>
          </span>
          <button 
            onClick={() => setAppointmentPage(p => p + 1)}
            disabled={appointmentPage >= appointmentPagination.totalPages}
            style={{
              padding: '8px 16px',
              background: appointmentPage >= appointmentPagination.totalPages ? '#555' : '#ff6600',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: appointmentPage >= appointmentPagination.totalPages ? 'not-allowed' : 'pointer',
              opacity: appointmentPage >= appointmentPagination.totalPages ? 0.5 : 1,
            }}
          >
            Następna →
          </button>
        </div>
      )}

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 'min(760px, 100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, color: '#ff6600' }}>Umów wizytę</h2>
              <button className="btn-secondary" onClick={closeModal} disabled={saving}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Tytuł</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Diagnostyka / wymiana oleju"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: '#0f0f0f',
                    color: '#fff',
                  }}
                />
              </div>

              {!(user && (user.rola === 'klient' || user.rola === 'user')) && (
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Klient</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: '#0f0f0f',
                    color: '#fff',
                  }}
                >
                  <option value="">Wybierz klienta…</option>
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              )}

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Pojazd</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!customerId}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: !customerId ? '#161616' : '#0f0f0f',
                    color: '#fff',
                    opacity: !customerId ? 0.7 : 1,
                  }}
                >
                  <option value="">{customerId ? 'Wybierz pojazd…' : 'Najpierw wybierz klienta'}</option>
                  {vehiclesForCustomer.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.year ?? '—'}) • {v.plate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Start</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: '#0f0f0f',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Koniec (opcjonalnie)</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: '#0f0f0f',
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Notatki (opcjonalnie)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: '#0f0f0f',
                    color: '#fff',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {formError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {formError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeModal} disabled={saving}>
                Anuluj
              </button>
              <button className="k-btn-primary" onClick={submitCreate} disabled={saving}>
                {saving ? 'Zapisywanie…' : 'Zapisz wizytę'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

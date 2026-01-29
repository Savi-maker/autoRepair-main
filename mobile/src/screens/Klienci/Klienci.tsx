import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import './Klienci.css'
import {
  getCustomers,
  getVehicles,
  getOrders,
  createCustomer,
  createOrder,
  type CustomerType,
  type VehicleType,
  type OrderType,
} from '../../utils/api'

export default function Klienci() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [customers, setCustomers] = useState<CustomerType[]>([])
  const [customerPage, setCustomerPage] = useState(1)
  const [customerPagination, setCustomerPagination] = useState<any>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  })
  const [vehicles, setVehicles] = useState<VehicleType[]>([])
  const [orders, setOrders] = useState<OrderType[]>([])

  const [openDetails, setOpenDetails] = useState(false)
  const [selected, setSelected] = useState<CustomerType | null>(null)

  const [openAddCustomer, setOpenAddCustomer] = useState(false)
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [customerError, setCustomerError] = useState<string | null>(null)
  const [cName, setCName] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cNotes, setCNotes] = useState('')

  const [openAddOrder, setOpenAddOrder] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [oService, setOService] = useState('')
  const [oOpis, setOOpis] = useState('')
  const [oCustomerId, setOCustomerId] = useState<number | ''>('')
  const [oVehicleId, setOVehicleId] = useState<number | ''>('')

  const loadAll = async (page: number = 1) => {
    setLoading(true)
    setError(null)

    const results = await Promise.allSettled([getCustomers(page, 20), getVehicles(), getOrders()])

    const [cRes, vRes, oRes] = results

    if (cRes.status === 'fulfilled' && cRes.value.success) {
      setCustomers(cRes.value.data || [])
      if (cRes.value.pagination) {
        setCustomerPagination(cRes.value.pagination)
      }
    }
    if (vRes.status === 'fulfilled' && vRes.value.success) {
      setVehicles(vRes.value.data || [])
    }
    if (oRes.status === 'fulfilled' && oRes.value.success) {
      setOrders(oRes.value.data || [])
    }

    const hasError = results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
    if (hasError) {
      const failedLoads = []
      if (cRes.status === 'rejected' || (cRes.status === 'fulfilled' && !cRes.value.success)) failedLoads.push('klienci')
      if (vRes.status === 'rejected' || (vRes.status === 'fulfilled' && !vRes.value.success)) failedLoads.push('pojazdy')
      if (oRes.status === 'rejected' || (oRes.status === 'fulfilled' && !oRes.value.success)) failedLoads.push('zlecenia')
      setError(`Błąd pobierania: ${failedLoads.join(', ')}`)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadAll(customerPage)
  }, [customerPage])

  const data = useMemo(() => {
    const ql = q.toLowerCase()
    return customers
      .filter((c) =>
        ql ? `${c.name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(ql) : true
      )
      .map((c) => {
        const ownedVehicles = vehicles.filter((v) => v.customer_id === c.id)
        const customerOrders = orders.filter((o) => o.customer_id === c.id)
        return { c, ownedVehicles, customerOrders }
      })
  }, [customers, vehicles, orders, q])

  const vehiclesForOrderCustomer = useMemo(() => {
    if (!oCustomerId) return []
    return vehicles.filter((v) => v.customer_id === Number(oCustomerId))
  }, [vehicles, oCustomerId])

  useEffect(() => {
    if (!oCustomerId) {
      setOVehicleId('')
      return
    }
    if (oVehicleId) {
      const v = vehicles.find((x) => x.id === Number(oVehicleId))
      if (!v || v.customer_id !== Number(oCustomerId)) setOVehicleId('')
    }
  }, [oCustomerId])

  const resetCustomerForm = () => {
    setCName('')
    setCEmail('')
    setCPhone('')
    setCNotes('')
    setCustomerError(null)
  }

  const resetOrderForm = () => {
    setOService('')
    setOOpis('')
    setOCustomerId('')
    setOVehicleId('')
    setOrderError(null)
  }

  const closeAddCustomer = () => {
    setOpenAddCustomer(false)
    resetCustomerForm()
  }

  const closeAddOrder = () => {
    setOpenAddOrder(false)
    resetOrderForm()
  }

  const submitAddCustomer = async () => {
    setCustomerError(null)

    const name = cName.trim()
    if (!name) return setCustomerError('Uzupełnij pole: Imię i nazwisko / Nazwa')

    setSavingCustomer(true)
    const resp = await createCustomer({
      name,
      email: cEmail.trim() ? cEmail.trim() : undefined,
      phone: cPhone.trim() ? cPhone.trim() : undefined,
      notes: cNotes.trim() ? cNotes.trim() : undefined,
    })
    setSavingCustomer(false)

    if (!resp.success) {
      setCustomerError(resp.message || 'Nie udało się dodać klienta')
      return
    }

    closeAddCustomer()
    await loadAll()
  }

  const submitAddOrder = async () => {
    setOrderError(null)

    const service = oService.trim()
    if (!service) return setOrderError('Uzupełnij pole: Usługa')
    if (!oCustomerId) return setOrderError('Wybierz klienta')
    if (!oVehicleId) return setOrderError('Wybierz pojazd')

    setSavingOrder(true)
    const resp = await createOrder({
      service,
      opis: oOpis.trim() ? oOpis.trim() : undefined,
      customer_id: Number(oCustomerId),
      vehicle_id: Number(oVehicleId),
      mechanic_user_id: null,
      start_at: null,
      end_at: null,
    })
    setSavingOrder(false)

    if (!resp.success) {
      setOrderError(resp.message || 'Nie udało się utworzyć zlecenia')
      return
    }

    closeAddOrder()
    await loadAll()
  }

  return (
    <div className="klienci-container">
      <div className="klienci-header">
        <div className="klienci-left">
          <AppButton variant="back" onClick={() => navigate(-1)}>
            ← Wróć
          </AppButton>
        </div>
        <h1>Klienci</h1>
        <div className="k-actions">
          <input
            className="k-search"
            placeholder="Szukaj po nazwisku, e-mailu, telefonie..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="k-btn-primary" onClick={() => setOpenAddCustomer(true)}>
            Dodaj klienta
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: 12 }}>⏳ Ładowanie…</div>}
      {error && <div style={{ padding: 12, color: '#ffb3b3' }}>⚠️ {error}</div>}

      <div className="klienci-grid">
        {data.map(({ c, ownedVehicles, customerOrders }) => (
          <div key={c.id} className="client-card">
            <div className="client-top">
              <div className="name">{c.name}</div>
              <div className="counts">
                {ownedVehicles.length} pojazd(y) • {customerOrders.length} zleceń
              </div>
            </div>

            <div className="meta">
              <b>Telefon:</b> {c.phone ?? '—'}
            </div>
            <div className="meta">
              <b>Email:</b> {c.email ?? '—'}
            </div>

            {ownedVehicles.length > 0 && (
              <div className="list">
                <div className="list-title">Pojazdy:</div>
                <ul>
                  {ownedVehicles.map((v) => (
                    <li key={v.id}>
                      {v.make} {v.model} {v.year ?? ''} — {v.plate}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelected(c)
                  setOpenDetails(true)
                }}
              >
                Szczegóły klienta
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setOCustomerId(c.id)
                  setOVehicleId('')
                  setOService('')
                  setOOpis('')
                  setOrderError(null)
                  setOpenAddOrder(true)
                }}
              >
                Nowe zlecenie
              </button>
            </div>
          </div>
        ))}
      </div>

      {customerPagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center', 
          padding: '16px 0',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
            disabled={customerPage === 1}
            style={{
              padding: '8px 16px',
              background: customerPage === 1 ? '#555' : '#ff6600',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: customerPage === 1 ? 'not-allowed' : 'pointer',
              opacity: customerPage === 1 ? 0.5 : 1,
            }}
          >
            ← Poprzednia
          </button>
          <span style={{ color: '#ccc', fontSize: '14px' }}>
            Strona <b>{customerPage}</b> z <b>{customerPagination.totalPages}</b>
          </span>
          <button 
            onClick={() => setCustomerPage(p => p + 1)}
            disabled={customerPage >= customerPagination.totalPages}
            style={{
              padding: '8px 16px',
              background: customerPage >= customerPagination.totalPages ? '#555' : '#ff6600',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: customerPage >= customerPagination.totalPages ? 'not-allowed' : 'pointer',
              opacity: customerPage >= customerPagination.totalPages ? 0.5 : 1,
            }}
          >
            Następna →
          </button>
        </div>
      )}

      {openDetails && selected && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenDetails(false)
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
              width: 'min(640px,100%)',
              background: '#151515',
              borderRadius: 14,
              padding: 18,
              color: '#fff',
              border: '1px solid rgba(255,102,0,0.2)',
            }}
          >
            <h2 style={{ color: '#ff6600', marginTop: 0 }}>{selected.name}</h2>
            <p>
              <b>Email:</b> {selected.email ?? '—'}
            </p>
            <p>
              <b>Telefon:</b> {selected.phone ?? '—'}
            </p>
            <p>
              <b>Notatki:</b> {selected.notes ?? '—'}
            </p>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setOpenDetails(false)}>
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {openAddCustomer && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddCustomer()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 10000,
          }}
        >
          <div
            style={{
              width: 'min(720px,100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <h2 style={{ margin: 0, color: '#ff6600' }}>Dodaj klienta</h2>
              <button className="btn-secondary" onClick={closeAddCustomer} disabled={savingCustomer}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>
                  Imię i nazwisko / Nazwa
                </label>
                <input
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>
                  Email (opcjonalnie)
                </label>
                <input
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>
                  Telefon (opcjonalnie)
                </label>
                <input
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>
                  Notatki (opcjonalnie)
                </label>
                <textarea
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
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

            {customerError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {customerError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeAddCustomer} disabled={savingCustomer}>
                Anuluj
              </button>
              <button className="k-btn-primary" onClick={submitAddCustomer} disabled={savingCustomer}>
                {savingCustomer ? 'Zapisywanie…' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {openAddOrder && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddOrder()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 11000,
          }}
        >
          <div
            style={{
              width: 'min(760px,100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <h2 style={{ margin: 0, color: '#ff6600' }}>Nowe zlecenie</h2>
              <button className="btn-secondary" onClick={closeAddOrder} disabled={savingOrder}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Usługa</label>
                <input
                  value={oService}
                  onChange={(e) => setOService(e.target.value)}
                  placeholder="np. Diagnostyka, wymiana oleju..."
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Klient</label>
                <select
                  value={oCustomerId}
                  onChange={(e) => setOCustomerId(e.target.value ? Number(e.target.value) : '')}
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
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Pojazd</label>
                <select
                  value={oVehicleId}
                  onChange={(e) => setOVehicleId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!oCustomerId}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: !oCustomerId ? '#161616' : '#0f0f0f',
                    color: '#fff',
                    opacity: !oCustomerId ? 0.7 : 1,
                  }}
                >
                  <option value="">{oCustomerId ? 'Wybierz pojazd…' : 'Najpierw wybierz klienta'}</option>
                  {vehiclesForOrderCustomer.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.year ?? '—'}) • {v.plate}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Opis (opcjonalnie)</label>
                <textarea
                  value={oOpis}
                  onChange={(e) => setOOpis(e.target.value)}
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

            {orderError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {orderError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeAddOrder} disabled={savingOrder}>
                Anuluj
              </button>
              <button className="k-btn-primary" onClick={submitAddOrder} disabled={savingOrder}>
                {savingOrder ? 'Zapisywanie…' : 'Utwórz zlecenie'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

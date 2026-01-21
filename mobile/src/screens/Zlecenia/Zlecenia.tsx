import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import './Zlecenia.css'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, ContactShadows, Environment } from '@react-three/drei'
import V8Engine from '../../components/models/v8Engine'

import {
  getOrders,
  getVehicles,
  getCustomers,
  createOrder,
  updateOrder,
  type OrderType,
  type VehicleType,
  type CustomerType,
} from '../../utils/api'

type UiOrderStatus = 'oczekujące' | 'w trakcie' | 'zakończone' | 'anulowane'
type FilterStatus = UiOrderStatus | 'wszystkie'

function mapBackendToUiStatus(s: string): UiOrderStatus {
  if (s === 'w_trakcie') return 'w trakcie'
  if (s === 'zakonczone') return 'zakończone'
  if (s === 'anulowane') return 'anulowane'
  return 'oczekujące'
}

function mapUiToBackendStatus(s: UiOrderStatus) {
  if (s === 'w trakcie') return 'w_trakcie'
  if (s === 'zakończone') return 'zakonczone'
  if (s === 'anulowane') return 'anulowane'
  return 'nowe'
}

export default function Zlecenia() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<FilterStatus>('wszystkie')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [orders, setOrders] = useState<OrderType[]>([])
  const [vehicles, setVehicles] = useState<VehicleType[]>([])
  const [customers, setCustomers] = useState<CustomerType[]>([])

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [service, setService] = useState('')
  const [opis, setOpis] = useState('')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [vehicleId, setVehicleId] = useState<number | ''>('')
  const [mechanicUserId, setMechanicUserId] = useState<string>('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsSaving, setDetailsSaving] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null)
  const [editStatus, setEditStatus] = useState<UiOrderStatus>('oczekujące')
  const [editOpis, setEditOpis] = useState('')

  // Lista prawidłowych części silnika V8 (nazwy węzłów z hierarchii GLTF)
  const ENGINE_PARTS_MAP: Record<string, string> = {
    // Głowice
    "Head_0": 'Głowica silnika',
    "Heads": 'Głowica silnika',
    // Kolektory i dolot
    "Intake.4_1": 'Kolektor dolotowy',
    "Intake_20": 'Kolektor dolotowy',
    "Intake.3_27": 'Kolektor dolotowy',
    "Intake.5_33": 'Filtr powietrza',
    "Filter": 'Filtr powietrza',
    "Intake.2_34": 'Przepustnica',
    "Throttle_body": 'Przepustnica',
    // Układ olejowy
    "Oil pan_2": 'Misa olejowa',
    "Oil pan.3_30": 'Misa olejowa',
    "Oil pan.4_31": 'Misa olejowa',
    "Oil pan.2_32": 'Misa olejowa',
    "Dip stick_5": 'Bagnet oleju',
    "Dipstick": 'Bagnet oleju',
    // Blok i osprzęt
    "Block_3": 'Blok silnika',
    "Bolts_4": 'Śruby mocujące',
    "Valve covers.2_6": 'Pokrywa zaworów',
    "Valve covers_18": 'Pokrywa zaworów',
    "Valve_covers": 'Pokrywa zaworów',
    "Distributor_7": 'Rozdzielacz zapłonu',
    "Transmission_8": 'Skrzynia biegów',
    "Fuel pump_9": 'Pompa paliwa',
    "Oil_pump": 'Pompa olejowa', // Dodano pompę olejową
    "Pulleys_10": 'Koła pasowe',
    "Belt_11": 'Pasek napędowy',
    "Alternator.2_12": 'Alternator',
    "Alternator_13": 'Alternator',
    // Zapłon
    "Spark plugs_14": 'Świece zapłonowe',
    "Spark_plugs": 'Świece zapłonowe',
    "Distributor.4_15": 'Przewody zapłonowe',
    "Distributor.3_16": 'Przewody zapłonowe',
    "Distributor.2_17": 'Przewody zapłonowe',
    "Ignition_wires": 'Przewody zapłonowe',
    // Wydech
    "Headers.3_19": 'Kolektor wydechowy',
    "Headers_23": 'Kolektor wydechowy',
    "Headers.2_26": 'Kolektor wydechowy',
    "Lines_21": 'Przewody paliwowe',
    "Turbo_22": 'Turbosprężarka',
    "Turbo.2_24": 'Turbosprężarka',
    "Turbo.4_28": 'Turbosprężarka',
    "Turbo.3_29": 'Turbosprężarka',
    "Exhaust_25": 'Układ wydechowy',
  };

  const [enginePartsRaw, setEnginePartsRaw] = useState<string[]>([])
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const uniqueLabels = useMemo(() => {
    return Array.from(new Set(Object.values(ENGINE_PARTS_MAP))).sort()
  }, [])

  const getTechnicalParts = (label: string | null): string[] => {
    if (!label) return []
    return Object.keys(ENGINE_PARTS_MAP).filter(
      (key) => ENGINE_PARTS_MAP[key] === label
    )
  }

  const resetForm = () => {
    setService('')
    setOpis('')
    setCustomerId('')
    setVehicleId('')
    setMechanicUserId('')
    setStartAt('')
    setEndAt('')
    setFormError(null)
  }

  const closeModal = () => {
    setOpen(false)
    resetForm()
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedOrder(null)
    setDetailsError(null)
    setEditOpis('')
    setEditStatus('oczekujące')
  }

  const reloadAll = async () => {
    setLoading(true)
    setError(null)

    const [oRes, vRes, cRes] = await Promise.all([getOrders(), getVehicles(), getCustomers()])

    if (!oRes.success) {
      setError(oRes.message || 'Błąd pobierania zleceń')
      setLoading(false)
      return
    }
    if (!vRes.success) {
      setError(vRes.message || 'Błąd pobierania pojazdów')
      setLoading(false)
      return
    }
    if (!cRes.success) {
      setError(cRes.message || 'Błąd pobierania klientów')
      setLoading(false)
      return
    }

    setOrders(oRes.data || [])
    setVehicles(vRes.data || [])
    setCustomers(cRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      await reloadAll()
      if (!alive) return
    })()
    return () => {
      alive = false
    }
  }, [])

  const vehiclesForCustomer = useMemo(() => {
    if (!customerId) return []
    return vehicles.filter((v) => v.customer_id === Number(customerId))
  }, [vehicles, customerId])

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

  const data = useMemo(() => {
    const qLower = q.trim().toLowerCase()

    return (orders || [])
      .filter((o) => {
        if (status === 'wszystkie') return true
        const uiStatus = mapBackendToUiStatus(String(o.status))
        return uiStatus === status
      })
      .filter((o) => {
        if (!qLower) return true
        const v = vehicles.find((v) => v.id === o.vehicle_id)
        const c = customers.find((c) => c.id === o.customer_id)
        const hay = `${o.service} ${o.status} ${o.opis ?? ''} ${v?.make ?? ''} ${v?.model ?? ''} ${
          v?.plate ?? ''
        } ${c?.name ?? ''}`.toLowerCase()
        return hay.includes(qLower)
      })
      .sort((a, b) => {
        const aTs = new Date(a.start_at || a.created_at).getTime()
        const bTs = new Date(b.start_at || b.created_at).getTime()
        return aTs - bTs
      })
  }, [orders, vehicles, customers, q, status])

  const submitCreate = async () => {
    setFormError(null)

    const s = service.trim()
    if (!s) return setFormError('Uzupełnij pole: Usługa')
    if (!customerId) return setFormError('Wybierz klienta')
    if (!vehicleId) return setFormError('Wybierz pojazd')

    const startIso = startAt ? new Date(startAt).toISOString() : null
    const endIso = endAt ? new Date(endAt).toISOString() : null

    if (startIso && endIso) {
      const a = new Date(startIso).getTime()
      const b = new Date(endIso).getTime()
      if (!Number.isNaN(a) && !Number.isNaN(b) && b < a) {
        return setFormError('Data zakończenia nie może być wcześniejsza niż rozpoczęcia')
      }
    }

    setSaving(true)
    const resp = await createOrder({
      service: s,
      opis: opis.trim() ? opis.trim() : undefined,
      customer_id: Number(customerId),
      vehicle_id: Number(vehicleId),
      mechanic_user_id: mechanicUserId.trim() ? Number(mechanicUserId) : null,
      start_at: startIso,
      end_at: endIso,
    })
    setSaving(false)

    if (!resp.success) {
      setFormError(resp.message || 'Nie udało się utworzyć zlecenia')
      return
    }

    closeModal()
    await reloadAll()
  }

  const openDetails = (o: OrderType) => {
    setSelectedOrder(o)
    setEditStatus(mapBackendToUiStatus(String(o.status)))
    setEditOpis(o.opis ?? '')
    setDetailsError(null)
    setDetailsOpen(true)
  }

  const submitDetailsSave = async () => {
    if (!selectedOrder) return
    setDetailsError(null)
    setDetailsSaving(true)

    const payload: any = {}
    const newStatus = mapUiToBackendStatus(editStatus)
    if (newStatus !== selectedOrder.status) payload.status = newStatus
    if ((editOpis ?? '') !== (selectedOrder.opis ?? '')) payload.opis = editOpis

    const resp = await updateOrder(selectedOrder.id, payload)
    setDetailsSaving(false)

    if (!resp.success) {
      setDetailsError(resp.message || 'Nie udało się zapisać zmian')
      return
    }

    closeDetails()
    await reloadAll()
  }

  const detailsVehicle = useMemo(() => {
    if (!selectedOrder) return null
    return vehicles.find((v) => v.id === selectedOrder.vehicle_id) || null
  }, [selectedOrder, vehicles])

  const detailsCustomer = useMemo(() => {
    if (!selectedOrder) return null
    return customers.find((c) => c.id === selectedOrder.customer_id) || null
  }, [selectedOrder, customers])

  return (
    <div className="zlecenia-container">
      <div className="zlecenia-header">
        <h1>Zlecenia</h1>
        <div className="zlecenia-actions">
          <input
            className="z-search"
            placeholder="Szukaj po pojeździe, kliencie, usłudze..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="z-select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="wszystkie">Wszystkie statusy</option>
            <option value="oczekujące">Oczekujące</option>
            <option value="w trakcie">W trakcie</option>
            <option value="zakończone">Zakończone</option>
            <option value="anulowane">Anulowane</option>
          </select>
          <button className="z-btn-primary" onClick={() => setOpen(true)}>
            Dodaj nowe zlecenie
          </button>
        </div>
      </div>

      {loading && <div style={{ opacity: 0.85, padding: 12 }}>⏳ Ładowanie…</div>}
      {!loading && error && <div style={{ color: '#ffb3b3', padding: 12 }}>⚠️ {error}</div>}

      <div className="zlecenia-grid">
        {data.map((o) => {
          const v = vehicles.find((v) => v.id === o.vehicle_id)
          const c = customers.find((c) => c.id === o.customer_id)

          const when = o.start_at || o.created_at
          const whenLabel = when ? new Date(when).toLocaleString() : '—'
          const uiStatus = mapBackendToUiStatus(String(o.status))

          return (
            <div key={o.id} className="order-card">
              <div className="card-top">
                <div className="title">{v ? `${v.make} ${v.model} ${v.year ?? ''}`.trim() : 'Pojazd'}</div>
                <StatusBadge status={uiStatus as any} />
              </div>

              <div className="meta">
                <b>Usługa:</b> {o.service}
              </div>
              <div className="meta">
                <b>Mechanik:</b> {o.mechanic_user_id ? `Mechanik #${o.mechanic_user_id}` : '—'}
              </div>
              <div className="meta">
                <b>Data:</b> {whenLabel}
              </div>
              <div className="meta">
                <b>Klient:</b> {c?.name ?? `Klient #${o.customer_id}`}
              </div>

              <div className="card-actions">
                <button className="z-btn-secondary btn-secondary" onClick={() => openDetails(o)}>
                  Szczegóły
                </button>
                <Link to="/pojazdy" className="btn-link">
                  Pojazd
                </Link>
              </div>
            </div>
          )
        })}
      </div>

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
              width: 'min(720px, 100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, color: '#ff6600' }}>Dodaj zlecenie</h2>
              <button className="z-btn-secondary btn-secondary" onClick={closeModal} disabled={saving}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Usługa</label>
                <input
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="np. Wymiana oleju i filtrów"
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>
                  Mechanik (opcjonalnie)
                </label>
                <input
                  value={mechanicUserId}
                  onChange={(e) => setMechanicUserId(e.target.value)}
                  placeholder="np. 2"
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
                  Start (opcjonalnie)
                </label>
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>
                  Koniec (opcjonalnie)
                </label>
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>
                  Opis (opcjonalnie)
                </label>
                <textarea
                  value={opis}
                  onChange={(e) => setOpis(e.target.value)}
                  placeholder="Dodatkowe informacje..."
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
              <button className="z-btn-secondary btn-secondary" onClick={closeModal} disabled={saving}>
                Anuluj
              </button>
              <button className="z-btn-primary" onClick={submitCreate} disabled={saving}>
                {saving ? 'Zapisywanie…' : 'Zapisz zlecenie'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="model-panel">
        <div className="model-sidebar">
          <div style={{ fontWeight: 700, marginBottom: 12, color: '#ff6600', fontSize: 14 }}>Podzespoły silnika</div>
          <div className="parts-list">
            <button
              className={`part-button ${!activeLabel ? 'active' : ''}`}
              onClick={() => setActiveLabel(null)}
              style={{
                width: '100%',
                padding: '8px 10px',
                marginBottom: 6,
                background: !activeLabel ? '#ff6600' : 'rgba(255,102,0,0.1)',
                color: !activeLabel ? '#000' : '#fff',
                border: '1px solid rgba(255,102,0,0.2)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              Pokaż wszystko
            </button>

            {uniqueLabels.map((label) => (
              <button
                key={label}
                className={`part-button ${activeLabel === label ? 'active' : ''}`}
                onClick={() => setActiveLabel(prev => prev === label ? null : label)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  marginBottom: 6,
                  background: activeLabel === label ? '#ff6600' : 'rgba(255,102,0,0.1)',
                  color: activeLabel === label ? '#000' : '#ddd',
                  border: '1px solid rgba(255,102,0,0.2)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  wordBreak: 'break-word',
                  textAlign: 'left',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="model-canvas">
          <Canvas shadows style={{ width: '100%', height: '100%' }} camera={{ position: [0, 1.2, 1.8], fov: 38 }}>
            <ambientLight intensity={0.25} />
            <hemisphereLight args={['#ffffff', '#222', 0.45]} />
            <directionalLight position={[5, 12, 8]} intensity={0.8} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={0.5} shadow-camera-far={100} />

            <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.3} />

            <Suspense fallback={<mesh />}>
              <Environment preset="studio" background={false} />
              <Stage adjustCamera={true} intensity={0.75} shadows={true}>
                <V8Engine 
                  position={[0, -0.2, 0]} 
                  rotation={[Math.PI / 2, 0, 0]}
                  onPartsLoaded={setEnginePartsRaw}
                  // Przekazujemy przefiltrowaną listę technicznych ID
                  highlightedPart={getTechnicalParts(activeLabel)}
                />
              </Stage>

              <ContactShadows position={[0, -0.9, 0]} opacity={0.8} width={4} height={4} blur={3} far={1.6} />
            </Suspense>
          </Canvas>
        </div>
      </section>

      {detailsOpen && selectedOrder && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetails()
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
              <h2 style={{ margin: 0, color: '#ff6600' }}>Szczegóły zlecenia #{selectedOrder.id}</h2>
              <button className="z-btn-secondary btn-secondary" onClick={closeDetails} disabled={detailsSaving}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 800 }}>
                    {detailsVehicle ? `${detailsVehicle.make} ${detailsVehicle.model} ${detailsVehicle.year ?? ''}`.trim() : 'Pojazd'}
                  </div>
                  <StatusBadge status={mapBackendToUiStatus(String(selectedOrder.status)) as any} />
                </div>
              </div>

              <div className="meta" style={{ gridColumn: '1 / -1' }}>
                <b>Usługa:</b> {selectedOrder.service}
              </div>

              <div className="meta">
                <b>Klient:</b> {detailsCustomer?.name ?? `Klient #${selectedOrder.customer_id}`}
              </div>

              <div className="meta">
                <b>Pojazd:</b> {detailsVehicle ? `${detailsVehicle.plate} • ${detailsVehicle.make} ${detailsVehicle.model}` : `Pojazd #${selectedOrder.vehicle_id}`}
              </div>

              <div className="meta">
                <b>Mechanik:</b> {selectedOrder.mechanic_user_id ? `Mechanik #${selectedOrder.mechanic_user_id}` : '—'}
              </div>

              <div className="meta">
                <b>Start:</b> {selectedOrder.start_at ? new Date(selectedOrder.start_at).toLocaleString() : '—'}
              </div>

              <div className="meta">
                <b>Koniec:</b> {selectedOrder.end_at ? new Date(selectedOrder.end_at).toLocaleString() : '—'}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div className="meta" style={{ marginBottom: 6 }}>
                  <b>Status</b>
                </div>
                <select className="z-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                  <option value="oczekujące">Oczekujące</option>
                  <option value="w trakcie">W trakcie</option>
                  <option value="zakończone">Zakończone</option>
                  <option value="anulowane">Anulowane</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div className="meta" style={{ marginBottom: 6 }}>
                  <b>Opis</b>
                </div>
                <textarea
                  value={editOpis}
                  onChange={(e) => setEditOpis(e.target.value)}
                  rows={5}
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

            {detailsError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {detailsError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="z-btn-secondary btn-secondary" onClick={closeDetails} disabled={detailsSaving}>
                Anuluj
              </button>
              <button className="z-btn-primary" onClick={submitDetailsSave} disabled={detailsSaving}>
                {detailsSaving ? 'Zapisywanie…' : 'Zapisz zmiany'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

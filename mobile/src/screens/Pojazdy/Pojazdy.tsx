import React, { Suspense, useEffect, useMemo, useState } from 'react'
import './Pojazdy.css'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, ContactShadows, Environment } from '@react-three/drei'
import CyberpunkCar from '../../components/models/cyberpunkCar'

import {
  getVehicles,
  getCustomers,
  createVehicle,
  updateVehicle,
  type VehicleType,
  type CustomerType,
} from '../../utils/api'

export default function Pojazdy() {
  const [q, setQ] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vehicles, setVehicles] = useState<VehicleType[]>([])
  const [customers, setCustomers] = useState<CustomerType[]>([])

  const [openAdd, setOpenAdd] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState<string>('')
  const [plate, setPlate] = useState('')
  const [vin, setVin] = useState('')
  const [customerId, setCustomerId] = useState<number | ''>('')

  const [openEdit, setOpenEdit] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [selected, setSelected] = useState<VehicleType | null>(null)

  const [openDetails, setOpenDetails] = useState(false)

  const resetAdd = () => {
    setMake('')
    setModel('')
    setYear('')
    setPlate('')
    setVin('')
    setCustomerId('')
    setAddError(null)
  }

  const closeAdd = () => {
    setOpenAdd(false)
    resetAdd()
  }

  const closeEdit = () => {
    setOpenEdit(false)
    setSelected(null)
    setEditError(null)
  }

  const closeDetails = () => {
    setOpenDetails(false)
    setSelected(null)
  }

  const reloadAll = async () => {
    setLoading(true)
    setError(null)

    const [vRes, cRes] = await Promise.all([getVehicles(), getCustomers()])

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

  const data = useMemo(() => {
    const qLower = q.trim().toLowerCase()
    return vehicles.filter((v) => {
      if (!qLower) return true
      const owner = customers.find((c) => c.id === v.customer_id)?.name ?? ''
      const hay = `${v.make} ${v.model} ${v.plate} ${owner}`.toLowerCase()
      return hay.includes(qLower)
    })
  }, [q, vehicles, customers])

  const submitAdd = async () => {
    setAddError(null)
    const m = make.trim()
    const mo = model.trim()
    const p = plate.trim()

    if (!customerId) return setAddError('Wybierz klienta')
    if (!m) return setAddError('Uzupełnij pole: Marka')
    if (!mo) return setAddError('Uzupełnij pole: Model')
    if (!p) return setAddError('Uzupełnij pole: Rejestracja')

    const y = year.trim()
    let yearNum: number | undefined = undefined
    if (y) {
      const parsed = Number(y)
      if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2100) {
        return setAddError('Nieprawidłowy rok')
      }
      yearNum = parsed
    }

    setAddSaving(true)
    const resp = await createVehicle({
      customer_id: Number(customerId),
      make: m,
      model: mo,
      year: yearNum,
      plate: p,
      vin: vin.trim() ? vin.trim() : undefined,
    })
    setAddSaving(false)

    if (!resp.success) {
      setAddError(resp.message || 'Nie udało się dodać pojazdu')
      return
    }

    closeAdd()
    await reloadAll()
  }

  const openEditModal = (v: VehicleType) => {
    setSelected(v)
    setCustomerId(v.customer_id)
    setMake(v.make || '')
    setModel(v.model || '')
    setYear(v.year != null ? String(v.year) : '')
    setPlate(v.plate || '')
    setVin(v.vin || '')
    setEditError(null)
    setOpenEdit(true)
  }

  const submitEdit = async () => {
    if (!selected) return
    setEditError(null)

    const m = make.trim()
    const mo = model.trim()
    const p = plate.trim()

    if (!customerId) return setEditError('Wybierz klienta')
    if (!m) return setEditError('Uzupełnij pole: Marka')
    if (!mo) return setEditError('Uzupełnij pole: Model')
    if (!p) return setEditError('Uzupełnij pole: Rejestracja')

    const y = year.trim()
    let yearNum: number | undefined = undefined
    if (y) {
      const parsed = Number(y)
      if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2100) {
        return setEditError('Nieprawidłowy rok')
      }
      yearNum = parsed
    }

    setEditSaving(true)
    const resp = await updateVehicle(selected.id, {
      customer_id: Number(customerId),
      make: m,
      model: mo,
      year: yearNum,
      plate: p,
      vin: vin.trim() ? vin.trim() : undefined,
    })
    setEditSaving(false)

    if (!resp.success) {
      setEditError(resp.message || 'Nie udało się zapisać zmian')
      return
    }

    closeEdit()
    resetAdd()
    await reloadAll()
  }

  const openDetailsModal = (v: VehicleType) => {
    setSelected(v)
    setOpenDetails(true)
  }

  return (
    <div className="pojazdy-container">
      <div className="pojazdy-header">
        <h1>Pojazdy</h1>
        <div className="p-actions">
          <input
            className="p-search"
            placeholder="Szukaj po marce, modelu, rejestracji..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="p-btn-primary" onClick={() => setOpenAdd(true)}>
            Dodaj pojazd
          </button>
        </div>
      </div>

      {loading && <div style={{ opacity: 0.85, padding: 12 }}>⏳ Ładowanie…</div>}
      {!loading && error && <div style={{ color: '#ffb3b3', padding: 12 }}>⚠️ {error}</div>}

      <div className="pojazdy-grid">
        {data.map((v) => {
          const owner = customers.find((c) => c.id === v.customer_id)
          return (
            <div key={v.id} className="vehicle-card">
              <div className="vehicle-top">
                <div className="vehicle-title">
                  {v.make} {v.model} <span className="muted">{v.year ?? '—'}</span>
                </div>
                <div className="plate">{v.plate}</div>
              </div>
              <div className="meta">
                <b>Właściciel:</b> {owner?.name ?? `Klient #${v.customer_id}`}
              </div>
              <div className="meta">
                <b>Ostatnia wizyta:</b> {v.last_service_at ? new Date(v.last_service_at).toLocaleString() : '—'}
              </div>
              <div className="card-actions">
                <button className="btn-secondary" onClick={() => openDetailsModal(v)}>
                  Szczegóły
                </button>
                <button className="btn-secondary" onClick={() => openEditModal(v)}>
                  Edytuj
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {openAdd && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAdd()
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
              <h2 style={{ margin: 0, color: '#ff6600' }}>Dodaj pojazd</h2>
              <button className="btn-secondary" onClick={closeAdd} disabled={addSaving}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Marka</label>
                <input
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Model</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Rok</label>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="np. 2016"
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Rejestracja</label>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="np. WX 12345"
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>VIN (opcjonalnie)</label>
                <input
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
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
            </div>

            {addError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {addError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeAdd} disabled={addSaving}>
                Anuluj
              </button>
              <button className="p-btn-primary" onClick={submitAdd} disabled={addSaving}>
                {addSaving ? 'Zapisywanie…' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {openEdit && selected && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit()
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
              <h2 style={{ margin: 0, color: '#ff6600' }}>Edytuj pojazd #{selected.id}</h2>
              <button className="btn-secondary" onClick={closeEdit} disabled={editSaving}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Marka</label>
                <input
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Model</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Rok</label>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="np. 2016"
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Rejestracja</label>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="np. WX 12345"
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>VIN (opcjonalnie)</label>
                <input
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
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
            </div>

            {editError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {editError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeEdit} disabled={editSaving}>
                Anuluj
              </button>
              <button className="p-btn-primary" onClick={submitEdit} disabled={editSaving}>
                {editSaving ? 'Zapisywanie…' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="model-panel">
        <div className="model-canvas">
          <Canvas shadows style={{ width: '100%', height: '100%' }} camera={{ position: [0, 1.2, 1.8], fov: 38 }}>
            <ambientLight intensity={0.45} />
            <hemisphereLight args={['#ffffff', '#222', 0.85]} />
            <directionalLight position={[5, 12, 8]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={0.5} shadow-camera-far={100} />

            <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.3} />

            <Suspense fallback={<mesh /> }>
              <Environment preset="studio" background={false} />
              <Stage adjustCamera={true} intensity={1.25} shadows={true}>
                <CyberpunkCar position={[0, -0.6, 0]} rotation={[0, Math.PI, 0]} />
              </Stage>

              <ContactShadows position={[0, -0.9, 0]} opacity={0.8} width={4} height={4} blur={3} far={1.6} />
            </Suspense>
          </Canvas>
        </div>
      </section>

      {openDetails && selected && (
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
            zIndex: 11000,
          }}
        >
          <div
            style={{
              width: 'min(900px, 100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, color: '#ff6600' }}>Szczegóły pojazdu</h2>
              <button className="btn-secondary" onClick={closeDetails}>
                Zamknij
              </button>
            </div>

            <div
              style={{
                marginTop: 12,
                background: '#0f0f0f',
                border: '1px solid rgba(255,102,0,0.12)',
                borderRadius: 14,
                padding: 14,
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  {selected.make} {selected.model} {selected.year != null ? `(${selected.year})` : ''}
                </div>
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    letterSpacing: 1,
                    fontWeight: 900,
                  }}
                >
                  {selected.plate}
                </div>
              </div>

              <div style={{ opacity: 0.95 }}>
                <b>Właściciel:</b>{' '}
                {customers.find((c) => c.id === selected.customer_id)?.name ?? `Klient #${selected.customer_id}`}
              </div>

              <div style={{ opacity: 0.95 }}>
                <b>VIN:</b> {selected.vin ? selected.vin : '—'}
              </div>

              <div style={{ opacity: 0.95 }}>
                <b>Ostatnia wizyta:</b>{' '}
                {selected.last_service_at ? new Date(selected.last_service_at).toLocaleString() : '—'}
              </div>

              <div style={{ opacity: 0.95 }}>
                <b>Dodano:</b> {selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => openEditModal(selected)}>
                  Edytuj
                </button>
                <button className="btn-secondary" onClick={closeDetails}>
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

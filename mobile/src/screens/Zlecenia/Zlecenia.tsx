import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import AppButton from '../../components/AppButton/AppButton'
import { useAuth } from '../../utils/useAuth'
import './Zlecenia.css'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, ContactShadows, Environment } from '@react-three/drei'
import V8Engine from '../../components/models/v8Engine'
import { canUseWebGL } from '../../utils/webglDetect'

import {
  getOrders,
  getVehicles,
  getCustomers,
  getMechanics,
  createOrder,
  updateOrder,
    getEngineParts,
    getOrderEngineEntries,
    createOrderEngineEntry,
    type EnginePartType,
    type EngineEntriesType,
    type EngineEntryKind,
  type OrderType,
  type VehicleType,
  type CustomerType,
  type AdminUserType,
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
  const navigate = useNavigate()
  const { hasPermission, user, loading: authLoading } = useAuth()
  const canViewCustomers = hasPermission('canViewCustomers')
  const canManageOrders = hasPermission('canManageOrders')
    const canCreateOrders = hasPermission('canCreateOrders')
    const isCustomer = user?.rola === 'klient' || user?.rola === 'user'
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<FilterStatus>('wszystkie')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [orders, setOrders] = useState<OrderType[]>([])
  const [orderPage, setOrderPage] = useState(1)
  const [orderPagination, setOrderPagination] = useState<any>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  })
  const [vehicles, setVehicles] = useState<VehicleType[]>([])
  const [customers, setCustomers] = useState<CustomerType[]>([])
  const [users, setUsers] = useState<AdminUserType[]>([])

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
  const [engineParts, setEngineParts] = useState<EnginePartType[]>([])
  const [selectedPartKeys, setSelectedPartKeys] = useState<string[]>([])
  const [unknownPart, setUnknownPart] = useState(false)
  const [partComments, setPartComments] = useState<Record<string, string>>({})
  const [engineEntries, setEngineEntries] = useState<EngineEntriesType | null>(null)
  const [entryKind, setEntryKind] = useState<EngineEntryKind>('customer_report')
  const [entryDescription, setEntryDescription] = useState('')
  const [entryDrafts, setEntryDrafts] = useState<Partial<Record<EngineEntryKind, string>>>({})
  const [entryPartDrafts, setEntryPartDrafts] = useState<Partial<Record<EngineEntryKind, string[]>>>({})
  const ENGINE_PARTS_MAP: Record<string, string> = {

    "Head_0": 'Głowica silnika',
    "Heads": 'Głowica silnika',

    "Intake.4_1": 'Kolektor dolotowy',
    "Intake_20": 'Kolektor dolotowy',
    "Intake.3_27": 'Kolektor dolotowy',
    "Intake.5_33": 'Filtr powietrza',
    "Filter": 'Filtr powietrza',
    "Intake.2_34": 'Przepustnica',
    "Throttle_body": 'Przepustnica',

    "Oil pan_2": 'Misa olejowa',
    "Oil pan.3_30": 'Misa olejowa',
    "Oil pan.4_31": 'Misa olejowa',
    "Oil pan.2_32": 'Misa olejowa',
    "Dip stick_5": 'Bagnet oleju',
    "Dipstick": 'Bagnet oleju',

    "Block_3": 'Blok silnika',
    "Bolts_4": 'Śruby mocujące',
    "Valve covers.2_6": 'Pokrywa zaworów',
    "Valve covers_18": 'Pokrywa zaworów',
    "Valve_covers": 'Pokrywa zaworów',
    "Distributor_7": 'Rozdzielacz zapłonu',
    "Transmission_8": 'Skrzynia biegów',
    "Fuel pump_9": 'Pompa paliwa',
    "Oil_pump": 'Pompa olejowa',
    "Pulleys_10": 'Koła pasowe',
    "Belt_11": 'Pasek napędowy',
    "Alternator.2_12": 'Alternator',
    "Alternator_13": 'Alternator',

    "Spark plugs_14": 'Świece zapłonowe',
    "Spark_plugs": 'Świece zapłonowe',
    "Distributor.4_15": 'Przewody zapłonowe',
    "Distributor.3_16": 'Przewody zapłonowe',
    "Distributor.2_17": 'Przewody zapłonowe',
    "Ignition_wires": 'Przewody zapłonowe',

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
  const [activeLabels, setActiveLabels] = useState<string[]>([])
  const uniqueLabels = useMemo(() => {
    return Array.from(new Set(Object.values(ENGINE_PARTS_MAP))).sort()
  }, [])

  const getTechnicalParts = (labels: string[]): string[] => {
    if (labels.length === 0) return []
    return Object.keys(ENGINE_PARTS_MAP).filter((key) => labels.includes(ENGINE_PARTS_MAP[key]))
  }

  const effectiveCustomerId = customerId || user?.customer_id || ''

  const resetForm = () => {
    setService('')
    setOpis('')
    setCustomerId('')
    setVehicleId('')
    setMechanicUserId('')
    setStartAt('')
    setEndAt('')
    setFormError(null)
    setSelectedPartKeys([])
    setUnknownPart(false)
    setPartComments({})
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
    setEntryDrafts({})
    setEntryPartDrafts({})
    setEntryDescription('')
    setEntryKind('customer_report')
  }

  const reloadAll = async (page: number = 1) => {
    setLoading(true)
    setError(null)

    const customersPromise = canViewCustomers
      ? getCustomers()
      : Promise.resolve({ success: true, message: 'OK', data: [] as CustomerType[] })
    const mechanicsPromise = canManageOrders
      ? getMechanics()
      : Promise.resolve({ success: true, message: 'OK', data: [] as AdminUserType[] })

    const vehiclesPromise = isCustomer ? getVehicles(1, 100) : getVehicles()
    const results = await Promise.allSettled([getOrders(page, 20), vehiclesPromise, customersPromise, mechanicsPromise, getEngineParts()])

    const [oRes, vRes, cRes, uRes, pRes] = results

    if (oRes.status === 'fulfilled' && oRes.value.success) {
      setOrders(oRes.value.data || [])
      if (oRes.value.pagination) {
        setOrderPagination(oRes.value.pagination)
      }
    }
    if (vRes.status === 'fulfilled' && vRes.value.success) {
      setVehicles(vRes.value.data || [])
    }
    if (cRes.status === 'fulfilled' && cRes.value.success) {
      setCustomers(cRes.value.data || [])
    }
    if (uRes.status === 'fulfilled' && uRes.value.success) {
      setUsers(uRes.value.data || [])
    }
    if (pRes.status === 'fulfilled' && pRes.value.success) setEngineParts(pRes.value.data?.parts || [])

    const hasError = results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
    if (hasError) {
      const failedLoads = []
      if (oRes.status === 'rejected' || (oRes.status === 'fulfilled' && !oRes.value.success)) failedLoads.push('zlecenia')
      if (vRes.status === 'rejected' || (vRes.status === 'fulfilled' && !vRes.value.success)) failedLoads.push('pojazdy')
      if (canViewCustomers && (cRes.status === 'rejected' || (cRes.status === 'fulfilled' && !cRes.value.success))) failedLoads.push('klienci')
      if (canManageOrders && (uRes.status === 'rejected' || (uRes.status === 'fulfilled' && !uRes.value.success))) failedLoads.push('użytkownicy')
      setError(`Błąd pobierania: ${failedLoads.join(', ')}`)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (isCustomer && user?.customer_id) setCustomerId(user.customer_id)
  }, [isCustomer, user?.customer_id])

  useEffect(() => {
    if (authLoading) return
    let alive = true
    ;(async () => {
      await reloadAll(orderPage)
      if (!alive) return
    })()
    return () => {
      alive = false
    }
  }, [orderPage, authLoading, canViewCustomers, canManageOrders])

  const vehiclesForCustomer = useMemo(() => {
    if (!effectiveCustomerId) return []
    return vehicles.filter((v) => v.customer_id === Number(effectiveCustomerId))
  }, [vehicles, effectiveCustomerId])

  const mechanics = useMemo(() => {
    return users.filter((u) => u.rola === 'mechanik')
  }, [users])

  useEffect(() => {
    if (!effectiveCustomerId) {
      setVehicleId('')
      return
    }
    if (vehicleId) {
      const v = vehicles.find((x) => x.id === Number(vehicleId))
      if (!v || v.customer_id !== Number(effectiveCustomerId)) setVehicleId('')
    }
  }, [effectiveCustomerId, vehicles, vehicleId])

  const data = useMemo(() => {
    const qLower = q.trim().toLowerCase()
    let filtered = (orders || [])

    return filtered
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
    const reportDescription = opis.trim()
    if (!s) return setFormError('Uzupełnij pole: Usługa')
    if (!isCustomer && !customerId) return setFormError('Wybierz klienta')
    if (!vehicleId) return setFormError('Wybierz pojazd')
    if (isCustomer && reportDescription.length < 5) return setFormError('Opisz objawy (minimum 5 znaków)')
    const startIso = startAt ? new Date(startAt).toISOString() : null
    const endIso = endAt ? new Date(endAt).toISOString() : null
    if (startIso && endIso && new Date(endIso).getTime() < new Date(startIso).getTime()) return setFormError('Data zakończenia nie może być wcześniejsza niż rozpoczęcia')
    setSaving(true)
    const resp = await createOrder({
      service: s, opis: reportDescription || undefined,
      vehicle_id: Number(vehicleId),
      ...(isCustomer ? { engine_report: { model_key: 'v8_engine_v1', general_description: reportDescription, unknown_part: unknownPart || selectedPartKeys.length === 0, parts: selectedPartKeys.map((part_key) => ({ part_key, comment: partComments[part_key] || '' })) } } : { customer_id: Number(customerId), mechanic_user_id: mechanicUserId.trim() ? Number(mechanicUserId) : null, start_at: startIso, end_at: endIso }),
    })
    setSaving(false)
    if (!resp.success) return setFormError(resp.message || 'Nie udało się utworzyć zlecenia')
    closeModal()
    await reloadAll()
  }

  const openDetails = async (o: OrderType) => {
    setSelectedOrder(o)
    setEditStatus(mapBackendToUiStatus(String(o.status)))
    setEditOpis(o.opis ?? '')
    setDetailsError(null)
    setEngineEntries(null)
    setDetailsOpen(true)
    const response = await getOrderEngineEntries(o.id)
    if (response.success && response.data) {
      setEngineEntries(response.data)
      const current = response.data.latest.customer_report
      setEntryDescription(current?.general_description || o.opis || '')
      setEntryDrafts({
        customer_report: current?.general_description || o.opis || '',
        mechanic_diagnosis: response.data.latest.mechanic_diagnosis?.general_description || '',
        repair_summary: response.data.latest.repair_summary?.general_description || '',
      })
      setEntryPartDrafts({
        customer_report: current?.parts.map((part) => part.part_key) || [],
        mechanic_diagnosis: response.data.latest.mechanic_diagnosis?.parts.map((part) => part.part_key) || [],
        repair_summary: response.data.latest.repair_summary?.parts.map((part) => part.part_key) || [],
      })
      setSelectedPartKeys(current?.parts.map((part) => part.part_key) || [])
      setUnknownPart(current?.unknown_part || false)
    }
  }

  const saveEngineEntry = async () => {
    if (!selectedOrder || !entryDescription.trim()) return
    const current = engineEntries?.latest[entryKind]
    setDetailsSaving(true)
    const response = await createOrderEngineEntry(selectedOrder.id, { kind: entryKind, model_key: 'v8_engine_v1', general_description: entryDescription.trim(), unknown_part: selectedPartKeys.length === 0, parts: selectedPartKeys.map((part_key) => ({ part_key, comment: partComments[part_key] || '' })), expected_revision: current?.revision || 0 })
    setDetailsSaving(false)
    if (!response.success) return setDetailsError(response.message)
    const refreshed = await getOrderEngineEntries(selectedOrder.id)
    if (refreshed.success && refreshed.data) {
      setEngineEntries(refreshed.data)
      setEntryDrafts((drafts) => ({ ...drafts, [entryKind]: entryDescription.trim() }))
      setEntryPartDrafts((drafts) => ({ ...drafts, [entryKind]: [...selectedPartKeys] }))
    }
  }

  const switchEntryKind = (kind: EngineEntryKind) => {
    setEntryDrafts((drafts) => ({ ...drafts, [entryKind]: entryDescription }))
    setEntryPartDrafts((drafts) => ({ ...drafts, [entryKind]: [...selectedPartKeys] }))
    setEntryKind(kind)
    setEntryDescription(entryDrafts[kind] ?? engineEntries?.latest[kind]?.general_description ?? '')
    setSelectedPartKeys(entryPartDrafts[kind] ?? engineEntries?.latest[kind]?.parts.map((part) => part.part_key) ?? [])
  }

  const getTechnicalPartsForKeys = (keys: string[]) => keys.flatMap((key) => {
    const definition = Object.entries(ENGINE_PARTS_MAP).filter(([, label]) => {
      const part = engineParts.find((item) => item.key === key)
      return part?.label === label
    })
    return definition.map(([technicalName]) => technicalName)
  })

  const submitDetailsSave = async () => {
    if (!selectedOrder) return
    setDetailsError(null)
    setDetailsSaving(true)

    const payload: any = {}
    const newStatus = mapUiToBackendStatus(editStatus)
    if (newStatus !== selectedOrder.status) payload.status = newStatus
    if ((editOpis ?? '') !== (selectedOrder.opis ?? '')) payload.opis = editOpis

    if (Object.keys(payload).length === 0) {
      setDetailsSaving(false)
      return
    }

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
        <div className="zlecenia-left">
          <AppButton variant="back" onClick={() => navigate(-1)}>
            ← Wróć
          </AppButton>
        </div>
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
          {canCreateOrders && (
            <AppButton variant="primary" onClick={() => setOpen(true)}>
              {isCustomer ? 'Zgłoś problem' : 'Dodaj nowe zlecenie'}
            </AppButton>
          )}
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

      {orderPagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center', 
          padding: '16px 0',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => setOrderPage(p => Math.max(1, p - 1))}
            disabled={orderPage === 1}
            style={{
              padding: '8px 16px',
              background: orderPage === 1 ? '#555' : '#ff6600',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: orderPage === 1 ? 'not-allowed' : 'pointer',
              opacity: orderPage === 1 ? 0.5 : 1,
            }}
          >
            ← Poprzednia
          </button>
          <span style={{ color: '#ccc', fontSize: '14px' }}>
            Strona <b>{orderPage}</b> z <b>{orderPagination.totalPages}</b>
          </span>
          <button 
            onClick={() => setOrderPage(p => p + 1)}
            disabled={orderPage >= orderPagination.totalPages}
            style={{
              padding: '8px 16px',
              background: orderPage >= orderPagination.totalPages ? '#555' : '#ff6600',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: orderPage >= orderPagination.totalPages ? 'not-allowed' : 'pointer',
              opacity: orderPage >= orderPagination.totalPages ? 0.5 : 1,
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
            className="zlecenia-modal-content"
            style={{
              width: 'min(720px, 100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
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

              {!isCustomer && <div>
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
              </div>}

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Pojazd</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!effectiveCustomerId}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: !effectiveCustomerId ? '#161616' : '#0f0f0f',
                    color: '#fff',
                    opacity: !effectiveCustomerId ? 0.7 : 1,
                  }}
                >
                  <option value="">{effectiveCustomerId ? 'Wybierz pojazd…' : 'Nie znaleziono powiązania klienta'}</option>
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
                <select
                  value={mechanicUserId}
                  onChange={(e) => setMechanicUserId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: '#0f0f0f',
                    color: '#fff',
                  }}
                >
                  <option value="">Wybierz mechanika…</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.imie} {m.nazwisko} ({m.mail})
                    </option>
                  ))}
                </select>
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

              {isCustomer && (
                <fieldset style={{ gridColumn: '1 / -1', border: '1px solid rgba(255,102,0,0.2)', borderRadius: 10, padding: 12 }}>
                  <legend style={{ color: '#ffcc99', fontWeight: 700 }}>Wskaż obszar na modelu silnika (opcjonalnie)</legend>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <input type="checkbox" checked={unknownPart} onChange={(e) => { setUnknownPart(e.target.checked); if (e.target.checked) { setSelectedPartKeys([]); setPartComments({}) } }} />
                    Nie wiem, którego elementu dotyczy problem
                  </label>
                  {!unknownPart && <div className="engine-part-picker">
                    {engineParts.map((part) => <label key={part.key} className="engine-part-option">
                      <input type="checkbox" checked={selectedPartKeys.includes(part.key)} onChange={(e) => setSelectedPartKeys((current) => e.target.checked ? [...current, part.key] : current.filter((key) => key !== part.key))} />
                      {part.label}
                    </label>)}
                  </div>}
                  <small>Model poglądowy silnika V8. Rozmieszczenie i wyposażenie mogą różnić się od Twojego pojazdu.</small>
                </fieldset>
              )}
              {isCustomer && canUseWebGL() && <div className="details-engine-preview report-engine-preview" style={{ gridColumn: '1 / -1' }}>
                <Canvas shadows camera={{ position: [0, 1.2, 1.8], fov: 38 }}>
                  <ambientLight intensity={0.25} />
                  <hemisphereLight args={['#ffffff', '#222', 0.45]} />
                  <directionalLight position={[5, 12, 8]} intensity={0.8} />
                  <OrbitControls enablePan enableZoom enableRotate />
                  <Suspense fallback={<mesh />}>
                    <Environment preset="studio" background={false} />
                    <Stage adjustCamera intensity={0.75}>
                      <V8Engine
                        position={[0, -0.2, 0]}
                        rotation={[Math.PI / 2, 0, 0]}
                        highlightedPart={getTechnicalPartsForKeys(selectedPartKeys)}
                        highlightColor={0xff6600}
                      />
                    </Stage>
                  </Suspense>
                </Canvas>
              </div>}
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

      {!detailsOpen && !open && <section className="model-panel">
        <div className="model-sidebar">
          <div style={{ fontWeight: 700, marginBottom: 12, color: '#ff6600', fontSize: 14 }}>Podzespoły silnika</div>
          <div className="parts-list">
            <button
              className={`part-button ${activeLabels.length === 0 ? 'active' : ''}`}
              onClick={() => setActiveLabels([])}
              style={{
                width: '100%',
                padding: '8px 10px',
                marginBottom: 6,
                background: activeLabels.length === 0 ? '#ff6600' : 'rgba(255,102,0,0.1)',
                color: activeLabels.length === 0 ? '#000' : '#fff',
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
                className={`part-button ${activeLabels.includes(label) ? 'active' : ''}`}
                onClick={() => setActiveLabels((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label])}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  marginBottom: 6,
                  background: activeLabels.includes(label) ? '#ff6600' : 'rgba(255,102,0,0.1)',
                  color: activeLabels.includes(label) ? '#000' : '#ddd',
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
          {canUseWebGL() && (
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

                    highlightedPart={getTechnicalParts(activeLabels)}
                  />
                </Stage>

                <ContactShadows position={[0, -0.9, 0]} opacity={0.8} width={4} height={4} blur={3} far={1.6} />
              </Suspense>
            </Canvas>
          )}
        </div>
      </section>}

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
            className="zlecenia-modal-content"
            style={{
              width: 'min(760px, 100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
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
              <section className="engine-entry-section" style={{ gridColumn: '1 / -1' }}>
                <h3>Silnik 3D i opis problemu</h3>
                {canUseWebGL() && <div className="details-engine-preview">
                  <Canvas shadows camera={{ position: [0, 1.2, 1.8], fov: 38 }}>
                    <ambientLight intensity={0.25} />
                    <hemisphereLight args={['#ffffff', '#222', 0.45]} />
                    <directionalLight position={[5, 12, 8]} intensity={0.8} />
                    <OrbitControls enablePan enableZoom enableRotate />
                    <Suspense fallback={<mesh />}>
                      <Environment preset="studio" background={false} />
                      <Stage adjustCamera intensity={0.75}>
                        <V8Engine
                          position={[0, -0.2, 0]}
                          rotation={[Math.PI / 2, 0, 0]}
                          highlightedPart={getTechnicalPartsForKeys(selectedPartKeys)}
                          highlightColor={entryKind === 'customer_report' ? 0xff6600 : entryKind === 'mechanic_diagnosis' ? 0xc45116 : 0x35c759}
                        />
                      </Stage>
                    </Suspense>
                  </Canvas>
                </div>}
                <p className="engine-note">Model poglądowy silnika V8. Zaznaczone elementy odpowiadają aktywnej zakładce.</p>
                <div className="engine-tabs" role="tablist">
                  {([['customer_report', 'Zgłoszenie klienta'], ['mechanic_diagnosis', 'Diagnoza mechanika'], ['repair_summary', 'Wykonane prace']] as const).map(([kind, label]) => (
                    <button key={kind} type="button" className={entryKind === kind ? 'active' : ''} onClick={() => switchEntryKind(kind)}>{label}</button>
                  ))}
                </div>
                <p className="engine-note">{engineEntries?.latest[entryKind] ? `Wersja ${engineEntries.latest[entryKind]?.revision}, autor: ${engineEntries.latest[entryKind]?.author_name}` : entryKind === 'mechanic_diagnosis' ? 'Warsztat nie dodał jeszcze diagnozy' : entryKind === 'repair_summary' ? 'Brak informacji o wykonanych pracach' : 'Brak zgłoszenia klienta'}</p>
                <textarea value={entryDescription} readOnly={!isCustomer && entryKind === 'customer_report'} onChange={(e) => setEntryDescription(e.target.value)} rows={4} placeholder="Ta treść będzie widoczna dla klienta" />
                {!isCustomer && entryKind !== 'customer_report' && <fieldset className="engine-entry-part-editor">
                  <legend>Elementy objęte diagnozą lub pracami</legend>
                  <div className="engine-part-picker">
                    {engineParts.map((part) => <label key={part.key} className="engine-part-option">
                      <input type="checkbox" checked={selectedPartKeys.includes(part.key)} onChange={(e) => setSelectedPartKeys((current) => e.target.checked ? [...current, part.key] : current.filter((key) => key !== part.key))} />
                      {part.label}
                    </label>)}
                  </div>
                  <small>Zaznaczone elementy są podświetlane kolorem aktywnej sekcji.</small>
                </fieldset>}
                <div className="engine-entry-parts">{(engineEntries?.latest[entryKind]?.parts || []).map((part) => <span key={part.part_key}>{engineParts.find((item) => item.key === part.part_key)?.label || part.part_key}</span>)}</div>
                <button type="button" className="z-btn-primary" onClick={saveEngineEntry} disabled={detailsSaving || (isCustomer ? entryKind !== 'customer_report' : entryKind === 'customer_report')}>Zapisz nową wersję</button>
                {engineEntries?.history.filter((entry) => entry.kind === entryKind).length ? <details><summary>Poprzednie wersje</summary>{engineEntries.history.filter((entry) => entry.kind === entryKind).map((entry) => <div key={entry.id} className="engine-history-row">Wersja {entry.revision}: {entry.general_description}</div>)}</details> : null}
                {!canUseWebGL() && <p className="engine-note">Model 3D jest niedostępny. Możesz wybrać podzespoły z listy.</p>}
              </section>
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

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import { useAuth } from '../../utils/useAuth'
import './Magazyn.css'
import {
  getParts,
  createPart,
  updatePart,
  deletePart,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type PartType,
  type SupplierType,
} from '../../utils/api'

function toMoney(v: number) {
  if (Number.isNaN(v)) return '0.00'
  return v.toFixed(2)
}

function toRating(v: number) {
  if (!Number.isFinite(v)) return '0.0'
  return Math.max(0, Math.min(5, v)).toFixed(1)
}

export default function Magazyn() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canViewSuppliers = hasPermission('canViewSuppliers')
  const canManageSuppliers = hasPermission('canManageSuppliers')

  const [view, setView] = useState<'parts' | 'suppliers'>('parts')
  const [q, setQ] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parts, setParts] = useState<PartType[]>([])

  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [suppliersError, setSuppliersError] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierType[]>([])


  const [openPartModal, setOpenPartModal] = useState(false)
  const [editing, setEditing] = useState<PartType | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)


  const [pName, setPName] = useState('')
  const [pSku, setPSku] = useState('')
  const [pBrand, setPBrand] = useState('')
  const [pStock, setPStock] = useState<string>('0')
  const [pMinStock, setPMinStock] = useState<string>('0')
  const [pPrice, setPPrice] = useState<string>('0')
  const [pLocation, setPLocation] = useState('')


  const [openReserve, setOpenReserve] = useState(false)
  const [reservePart, setReservePart] = useState<PartType | null>(null)
  const [reserveQty, setReserveQty] = useState<string>('1')
  const [reserveError, setReserveError] = useState<string | null>(null)
  const [reserving, setReserving] = useState(false)


  const [openOrder, setOpenOrder] = useState(false)
  const [orderPart, setOrderPart] = useState<PartType | null>(null)
  const [orderSupplierId, setOrderSupplierId] = useState<string>('')
  const [orderQty, setOrderQty] = useState<string>('1')
  const [orderNote, setOrderNote] = useState<string>('')
  const [orderError, setOrderError] = useState<string | null>(null)

  const [openSupplierModal, setOpenSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierType | null>(null)
  const [supplierSaving, setSupplierSaving] = useState(false)
  const [supplierFormError, setSupplierFormError] = useState<string | null>(null)

  const [sName, setSName] = useState('')
  const [sContactPerson, setSContactPerson] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPhone, setSPhone] = useState('')
  const [sAddress, setSAddress] = useState('')
  const [sCity, setSCity] = useState('')
  const [sPostalCode, setSPostalCode] = useState('')
  const [sPaymentTerms, setSPaymentTerms] = useState('')
  const [sRating, setSRating] = useState('0')
  const [sIsActive, setSIsActive] = useState(true)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await getParts()
      if (!resp.success) {
        setError(resp.message || 'Błąd części')
        setLoading(false)
        return
      }
      setParts(resp.data || [])
      setLoading(false)
    } catch (e: any) {
      setError(e?.message || 'Network error')
      setLoading(false)
    }
  }

  const loadSuppliers = async (query?: string) => {
    if (!canViewSuppliers) return

    setSuppliersLoading(true)
    setSuppliersError(null)
    try {
      const resp = await getSuppliers(query)
      if (!resp.success) {
        setSuppliersError(resp.message || 'Błąd dostawców')
        setSuppliersLoading(false)
        return
      }
      setSuppliers(resp.data || [])
      setSuppliersLoading(false)
    } catch (e: any) {
      setSuppliersError(e?.message || 'Network error')
      setSuppliersLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    loadSuppliers()
  }, [])

  const data = useMemo(() => {
    const ql = q.toLowerCase().trim()
    return parts
      .filter((p) => (onlyLow ? p.stock <= p.min_stock : true))
      .filter((p) => {
        if (!ql) return true
        return `${p.name} ${p.sku} ${p.brand ?? ''}`.toLowerCase().includes(ql)
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [parts, q, onlyLow])

  const supplierData = useMemo(() => {
    const ql = q.toLowerCase().trim()
    return suppliers
      .filter((s) => {
        if (!ql) return true
        return `${s.name} ${s.contact_person ?? ''} ${s.email ?? ''} ${s.phone ?? ''} ${s.city ?? ''}`
          .toLowerCase()
          .includes(ql)
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [suppliers, q])

  const activeSuppliers = useMemo(() => {
    return suppliers
      .filter((s) => Boolean(s.is_active))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [suppliers])

  const resetForm = () => {
    setFormError(null)
    setPName('')
    setPSku('')
    setPBrand('')
    setPStock('0')
    setPMinStock('0')
    setPPrice('0')
    setPLocation('')
  }

  const openAdd = () => {
    setEditing(null)
    resetForm()
    setOpenPartModal(true)
  }

  const openEdit = (p: PartType) => {
    setEditing(p)
    setFormError(null)
    setPName(p.name ?? '')
    setPSku(p.sku ?? '')
    setPBrand(p.brand ?? '')
    setPStock(String(p.stock ?? 0))
    setPMinStock(String(p.min_stock ?? 0))
    setPPrice(String(p.price ?? 0))
    setPLocation(p.location ?? '')
    setOpenPartModal(true)
  }

  const closePartModal = () => {
    if (saving) return
    setOpenPartModal(false)
    setEditing(null)
    resetForm()
  }

  const submitPart = async () => {
    setFormError(null)

    const name = pName.trim()
    const sku = pSku.trim()
    const brand = pBrand.trim()
    const location = pLocation.trim()

    if (!name) return setFormError('Uzupełnij pole: Nazwa')
    if (!sku) return setFormError('Uzupełnij pole: SKU')

    const stockNum = Number(pStock)
    const minStockNum = Number(pMinStock)
    const priceNum = Number(pPrice)

    if (!Number.isFinite(stockNum) || stockNum < 0) return setFormError('Stan musi być liczbą ≥ 0')
    if (!Number.isFinite(minStockNum) || minStockNum < 0) return setFormError('Min. stan musi być liczbą ≥ 0')
    if (!Number.isFinite(priceNum) || priceNum < 0) return setFormError('Cena musi być liczbą ≥ 0')

    setSaving(true)

    const payload: Partial<PartType> = {
      name,
      sku,
      brand: brand ? brand : null,
      stock: Math.floor(stockNum),
      min_stock: Math.floor(minStockNum),
      price: priceNum,
      location: location ? location : null,
    }

    const resp = editing ? await updatePart(editing.id, payload) : await createPart(payload)
    setSaving(false)

    if (!resp.success) {
      setFormError(resp.message || 'Nie udało się zapisać części')
      return
    }

    const saved = resp.data
    if (saved) {
      setParts((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id)
        if (idx === -1) return [saved, ...prev]
        const next = prev.slice()
        next[idx] = saved
        return next
      })
    } else {
      await loadAll()
    }

    closePartModal()
  }

  const onDelete = async (p: PartType) => {
    const ok = window.confirm(`Usunąć część: "${p.name}"?`)
    if (!ok) return

    const prev = parts
    setParts((x) => x.filter((a) => a.id !== p.id))

    const resp = await deletePart(p.id)
    if (!resp.success) {
      setParts(prev)
      alert(resp.message || 'Nie udało się usunąć części')
    }
  }

  const resetSupplierForm = () => {
    setSupplierFormError(null)
    setSName('')
    setSContactPerson('')
    setSEmail('')
    setSPhone('')
    setSAddress('')
    setSCity('')
    setSPostalCode('')
    setSPaymentTerms('')
    setSRating('0')
    setSIsActive(true)
  }

  const openAddSupplier = () => {
    setEditingSupplier(null)
    resetSupplierForm()
    setOpenSupplierModal(true)
  }

  const openEditSupplier = (s: SupplierType) => {
    setEditingSupplier(s)
    setSupplierFormError(null)
    setSName(s.name ?? '')
    setSContactPerson(s.contact_person ?? '')
    setSEmail(s.email ?? '')
    setSPhone(s.phone ?? '')
    setSAddress(s.address ?? '')
    setSCity(s.city ?? '')
    setSPostalCode(s.postal_code ?? '')
    setSPaymentTerms(s.payment_terms ?? '')
    setSRating(String(s.rating ?? 0))
    setSIsActive(Boolean(s.is_active))
    setOpenSupplierModal(true)
  }

  const closeSupplierModal = () => {
    if (supplierSaving) return
    setOpenSupplierModal(false)
    setEditingSupplier(null)
    resetSupplierForm()
  }

  const submitSupplier = async () => {
    setSupplierFormError(null)

    const name = sName.trim()
    if (!name) return setSupplierFormError('Uzupełnij pole: Nazwa dostawcy')

    const ratingNum = Number(sRating)
    if (!Number.isFinite(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      return setSupplierFormError('Ocena musi być liczbą z zakresu 0-5')
    }

    const payload: Partial<SupplierType> = {
      name,
      contact_person: sContactPerson.trim() || null,
      email: sEmail.trim() || null,
      phone: sPhone.trim() || null,
      address: sAddress.trim() || null,
      city: sCity.trim() || null,
      postal_code: sPostalCode.trim() || null,
      payment_terms: sPaymentTerms.trim() || null,
      rating: Number(toRating(ratingNum)),
      is_active: sIsActive ? 1 : 0,
    }

    setSupplierSaving(true)
    const resp = editingSupplier
      ? await updateSupplier(editingSupplier.id, payload)
      : await createSupplier(payload)
    setSupplierSaving(false)

    if (!resp.success) {
      setSupplierFormError(resp.message || 'Nie udało się zapisać dostawcy')
      return
    }

    const saved = resp.data
    if (saved) {
      setSuppliers((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id)
        if (idx === -1) return [saved, ...prev]
        const next = prev.slice()
        next[idx] = saved
        return next
      })
    } else {
      await loadSuppliers(q)
    }

    closeSupplierModal()
  }

  const onDeleteSupplier = async (s: SupplierType) => {
    const ok = window.confirm(`Usunąć dostawcę: "${s.name}"?`)
    if (!ok) return

    const prev = suppliers
    setSuppliers((x) => x.filter((a) => a.id !== s.id))

    const resp = await deleteSupplier(s.id)
    if (!resp.success) {
      setSuppliers(prev)
      alert(resp.message || 'Nie udało się usunąć dostawcy')
    }
  }



  const openReserveModal = (p: PartType) => {
    setReservePart(p)
    setReserveQty('1')
    setReserveError(null)
    setOpenReserve(true)
  }

  const closeReserveModal = () => {
    if (reserving) return
    setOpenReserve(false)
    setReservePart(null)
    setReserveQty('1')
    setReserveError(null)
  }

  const submitReserve = async () => {
    setReserveError(null)
    if (!reservePart) return

    const qty = Math.floor(Number(reserveQty))
    if (!Number.isFinite(qty) || qty <= 0) return setReserveError('Podaj ilość > 0')
    if (qty > reservePart.stock) return setReserveError(`Brak tylu sztuk na stanie (max: ${reservePart.stock})`)

    const newStock = reservePart.stock - qty


    const prev = parts
    setParts((ps) => ps.map((x) => (x.id === reservePart.id ? { ...x, stock: newStock } : x)))

    setReserving(true)
    const resp = await updatePart(reservePart.id, { stock: newStock })
    setReserving(false)

    if (!resp.success) {
      setParts(prev)
      setReserveError(resp.message || 'Nie udało się zarezerwować')
      return
    }

    const saved = resp.data
    if (saved) {
      setParts((ps) => ps.map((x) => (x.id === saved.id ? saved : x)))
    }

    closeReserveModal()
  }



  const openOrderModal = (p: PartType) => {
    if (canViewSuppliers && suppliers.length === 0) {
      loadSuppliers()
    }
    setOrderPart(p)
    setOrderError(null)
    setOrderNote('')
    const suggested = Math.max(1, (p.min_stock - p.stock) + 1)
    setOrderQty(String(suggested))
    const firstActive = activeSuppliers[0]
    setOrderSupplierId(firstActive ? String(firstActive.id) : '')
    setOpenOrder(true)
  }

  const closeOrderModal = () => {
    setOpenOrder(false)
    setOrderPart(null)
    setOrderSupplierId('')
    setOrderQty('1')
    setOrderNote('')
    setOrderError(null)
  }

  const submitOrder = () => {
    setOrderError(null)
    if (!orderPart) return

    const qty = Math.floor(Number(orderQty))
    if (!Number.isFinite(qty) || qty <= 0) return setOrderError('Podaj ilość > 0')

    if (!canViewSuppliers) {
      return setOrderError('Brak uprawnień do listy dostawców. Skontaktuj się z administratorem.')
    }

    const supplierIdNum = Number(orderSupplierId)
    if (!Number.isFinite(supplierIdNum) || supplierIdNum <= 0) {
      return setOrderError('Wybierz dostawcę')
    }

    const supplier = activeSuppliers.find((s) => s.id === supplierIdNum)
    if (!supplier) {
      return setOrderError('Wybrany dostawca jest niedostępny')
    }


    alert(
      `Zamówienie (UI):\n\nCzęść: ${orderPart.name}\nSKU: ${orderPart.sku}\nIlość: ${qty}\nDostawca: ${supplier.name}\nNotatka: ${orderNote.trim() || '—'}`
    )
    closeOrderModal()
  }

  return (
    <div className="magazyn-container">
      <div className="magazyn-header">
        <AppButton variant="back" onClick={() => navigate(-1)}>
          ← Wróć
        </AppButton>
        <h1>{view === 'parts' ? 'Magazyn części' : 'Dostawcy'}</h1>
        <div className="m-actions">
          <div className="m-segment">
            <button
              className={`m-segment-btn ${view === 'parts' ? 'active' : ''}`}
              onClick={() => {
                setView('parts')
                setQ('')
              }}
            >
              Części
            </button>
            {canViewSuppliers && (
              <button
                className={`m-segment-btn ${view === 'suppliers' ? 'active' : ''}`}
                onClick={() => {
                  setView('suppliers')
                  setQ('')
                  loadSuppliers()
                }}
              >
                Dostawcy
              </button>
            )}
          </div>
          <input
            className="m-search"
            placeholder={view === 'parts' ? 'Szukaj po nazwie / SKU / marce...' : 'Szukaj po nazwie / osobie / mieście...'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {view === 'parts' && (
            <>
              <label className="m-toggle">
                <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
                <span>Tylko niskie stany</span>
              </label>
              <button className="m-btn-primary" onClick={openAdd}>
                ➕ Dodaj część
              </button>
            </>
          )}
          {view === 'suppliers' && canManageSuppliers && (
            <button className="m-btn-primary" onClick={openAddSupplier}>
              ➕ Dodaj dostawcę
            </button>
          )}
        </div>
      </div>

      {view === 'parts' && loading && <div style={{ padding: 12 }}>⏳ Ładowanie…</div>}
      {view === 'parts' && error && <div style={{ padding: 12, color: '#ffb3b3' }}>⚠️ {error}</div>}

      {view === 'suppliers' && suppliersLoading && <div style={{ padding: 12 }}>⏳ Ładowanie dostawców…</div>}
      {view === 'suppliers' && suppliersError && <div style={{ padding: 12, color: '#ffb3b3' }}>⚠️ {suppliersError}</div>}

      {view === 'suppliers' && !canViewSuppliers && (
        <div style={{ padding: 12, color: '#ffb3b3' }}>⚠️ Brak uprawnień do podglądu dostawców.</div>
      )}

      {view === 'parts' && !loading && !error && data.length === 0 && (
        <div style={{ padding: 12, color: '#ddd' }}>Brak części do wyświetlenia.</div>
      )}

      {view === 'suppliers' && canViewSuppliers && !suppliersLoading && !suppliersError && supplierData.length === 0 && (
        <div style={{ padding: 12, color: '#ddd' }}>Brak dostawców do wyświetlenia.</div>
      )}

      {view === 'parts' && (
      <div className="parts-grid">
        {data.map((p) => {
          const low = p.stock <= p.min_stock
          return (
            <div key={p.id} className="part-card">
              <div className="p-top">
                <div className="p-name">{p.name}</div>
                <div className={`p-stock ${low ? 'low' : 'ok'}`}>{p.stock} szt.</div>
              </div>
              <div className="p-meta">
                <b>SKU:</b> {p.sku}
              </div>
              <div className="p-meta">
                <b>Marka:</b> {p.brand ?? '—'}
              </div>
              <div className="p-meta">
                <b>Min. stan:</b> {p.min_stock}
              </div>
              <div className="p-meta">
                <b>Lokalizacja:</b> {p.location ?? '—'}
              </div>
              <div className="p-meta">
                <b>Cena:</b> {toMoney(p.price)} zł
              </div>

              <div className="p-actions">
                <button className="btn-secondary" onClick={() => openReserveModal(p)}>
                  Zarezerwuj
                </button>
                <button className="btn-secondary" onClick={() => openEdit(p)}>
                  Edytuj
                </button>
                <button className="m-btn-primary ghost" onClick={() => openOrderModal(p)}>
                  Zamów
                </button>
                <button className="m-btn-primary ghost" onClick={() => onDelete(p)} title="Usuń część">
                  Usuń
                </button>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {view === 'suppliers' && canViewSuppliers && (
        <div className="parts-grid">
          {supplierData.map((s) => (
            <div key={s.id} className="part-card">
              <div className="p-top">
                <div className="p-name">{s.name}</div>
                <div className={`p-stock ${s.is_active ? 'ok' : 'low'}`}>{s.is_active ? 'Aktywny' : 'Nieaktywny'}</div>
              </div>
              <div className="p-meta">
                <b>Osoba kontaktowa:</b> {s.contact_person ?? '—'}
              </div>
              <div className="p-meta">
                <b>Email:</b> {s.email ?? '—'}
              </div>
              <div className="p-meta">
                <b>Telefon:</b> {s.phone ?? '—'}
              </div>
              <div className="p-meta">
                <b>Miasto:</b> {s.city ?? '—'}
              </div>
              <div className="p-meta">
                <b>Adres:</b> {s.address ?? '—'}
              </div>
              <div className="p-meta">
                <b>Kod pocztowy:</b> {s.postal_code ?? '—'}
              </div>
              <div className="p-meta">
                <b>Warunki płatności:</b> {s.payment_terms ?? '—'}
              </div>
              <div className="p-meta">
                <b>Ocena:</b> {toRating(s.rating)} / 5
              </div>

              <div className="p-actions">
                {canManageSuppliers && (
                  <button className="btn-secondary" onClick={() => openEditSupplier(s)}>
                    Edytuj
                  </button>
                )}
                {canManageSuppliers && (
                  <button className="m-btn-primary ghost" onClick={() => onDeleteSupplier(s)} title="Usuń dostawcę">
                    Usuń
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {openPartModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closePartModal()
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
              width: 'min(820px,100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, color: '#ff6600' }}>{editing ? 'Edytuj część' : 'Dodaj część'}</h2>
              <button className="btn-secondary" onClick={closePartModal} disabled={saving}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Nazwa</label>
                <input
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>SKU</label>
                <input
                  value={pSku}
                  onChange={(e) => setPSku(e.target.value)}
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
                  Marka (opcjonalnie)
                </label>
                <input
                  value={pBrand}
                  onChange={(e) => setPBrand(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Stan</label>
                <input
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  inputMode="numeric"
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Min. stan</label>
                <input
                  value={pMinStock}
                  onChange={(e) => setPMinStock(e.target.value)}
                  inputMode="numeric"
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Cena (zł)</label>
                <input
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                  inputMode="decimal"
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
                  Lokalizacja (opcjonalnie)
                </label>
                <input
                  value={pLocation}
                  onChange={(e) => setPLocation(e.target.value)}
                  placeholder="np. A1, B3..."
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

            {formError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {formError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closePartModal} disabled={saving}>
                Anuluj
              </button>
              <button className="m-btn-primary" onClick={submitPart} disabled={saving}>
                {saving ? 'Zapisywanie…' : editing ? 'Zapisz zmiany' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      )}
      {openReserve && reservePart && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReserveModal()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 12000,
          }}
        >
          <div
            style={{
              width: 'min(640px,100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, color: '#ff6600' }}>Zarezerwuj</h2>
              <button className="btn-secondary" onClick={closeReserveModal} disabled={reserving}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 10, color: '#ddd' }}>
              <div style={{ fontWeight: 800, color: '#ffcc99' }}>{reservePart.name}</div>
              <div style={{ marginTop: 6 }}>
                <b>SKU:</b> {reservePart.sku} • <b>Stan:</b> {reservePart.stock} szt.
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>
                Ilość do rezerwacji
              </label>
              <input
                value={reserveQty}
                onChange={(e) => setReserveQty(e.target.value)}
                inputMode="numeric"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,102,0,0.18)',
                  background: '#0f0f0f',
                  color: '#fff',
                }}
              />
              <div style={{ marginTop: 6, color: '#aaa', fontSize: 12 }}>
                Po rezerwacji stan spadnie do: {Math.max(0, reservePart.stock - Math.floor(Number(reserveQty || 0)))} szt.
              </div>
            </div>

            {reserveError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {reserveError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeReserveModal} disabled={reserving}>
                Anuluj
              </button>
              <button className="m-btn-primary" onClick={submitReserve} disabled={reserving}>
                {reserving ? 'Rezerwuję…' : 'Zarezerwuj'}
              </button>
            </div>
          </div>
        </div>
      )}
      {openOrder && orderPart && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeOrderModal()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 12000,
          }}
        >
          <div
            style={{
              width: 'min(680px,100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, color: '#ff6600' }}>Zamów część</h2>
              <button className="btn-secondary" onClick={closeOrderModal}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 10, color: '#ddd' }}>
              <div style={{ fontWeight: 800, color: '#ffcc99' }}>{orderPart.name}</div>
              <div style={{ marginTop: 6 }}>
                <b>SKU:</b> {orderPart.sku} • <b>Stan:</b> {orderPart.stock} szt. • <b>Min:</b> {orderPart.min_stock}
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>
                  Dostawca
                </label>
                <select
                  value={orderSupplierId}
                  onChange={(e) => setOrderSupplierId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: '#0f0f0f',
                    color: '#fff',
                  }}
                >
                  <option value="">Wybierz dostawcę...</option>
                  {activeSuppliers.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}{s.city ? ` (${s.city})` : ''}
                    </option>
                  ))}
                </select>
                {canViewSuppliers && activeSuppliers.length === 0 && (
                  <div style={{ marginTop: 6, color: '#aaa', fontSize: 12 }}>
                    Brak aktywnych dostawców. Dodaj dostawcę w zakładce Dostawcy.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Ilość</label>
                <input
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  inputMode="numeric"
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
                  Notatka (opcjonalnie)
                </label>
                <input
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="np. dostawa jutro, hurtownia X..."
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

            {orderError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {orderError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeOrderModal}>
                Anuluj
              </button>
              <button className="m-btn-primary" onClick={submitOrder}>
                Złóż zamówienie
              </button>
            </div>
          </div>
        </div>
      )}
      {openSupplierModal && canManageSuppliers && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSupplierModal()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 12000,
          }}
        >
          <div
            style={{
              width: 'min(920px,100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              border: '1px solid rgba(255,102,0,0.15)',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, color: '#ff6600' }}>{editingSupplier ? 'Edytuj dostawcę' : 'Dodaj dostawcę'}</h2>
              <button className="btn-secondary" onClick={closeSupplierModal} disabled={supplierSaving}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Nazwa</label>
                <input
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Osoba kontaktowa</label>
                <input
                  value={sContactPerson}
                  onChange={(e) => setSContactPerson(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Email</label>
                <input
                  value={sEmail}
                  onChange={(e) => setSEmail(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Telefon</label>
                <input
                  value={sPhone}
                  onChange={(e) => setSPhone(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Miasto</label>
                <input
                  value={sCity}
                  onChange={(e) => setSCity(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Kod pocztowy</label>
                <input
                  value={sPostalCode}
                  onChange={(e) => setSPostalCode(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Adres</label>
                <input
                  value={sAddress}
                  onChange={(e) => setSAddress(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Warunki płatności</label>
                <input
                  value={sPaymentTerms}
                  onChange={(e) => setSPaymentTerms(e.target.value)}
                  placeholder="np. 14 dni"
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#ffcc99' }}>Ocena (0-5)</label>
                <input
                  value={sRating}
                  onChange={(e) => setSRating(e.target.value)}
                  inputMode="decimal"
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

            <label className="m-toggle" style={{ marginTop: 12 }}>
              <input type="checkbox" checked={sIsActive} onChange={(e) => setSIsActive(e.target.checked)} />
              <span>Aktywny dostawca</span>
            </label>

            {supplierFormError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {supplierFormError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeSupplierModal} disabled={supplierSaving}>
                Anuluj
              </button>
              <button className="m-btn-primary" onClick={submitSupplier} disabled={supplierSaving}>
                {supplierSaving ? 'Zapisywanie…' : editingSupplier ? 'Zapisz zmiany' : 'Dodaj dostawcę'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

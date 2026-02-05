import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import './Magazyn.css'
import { getParts, createPart, updatePart, deletePart, type PartType } from '../../utils/api'

function toMoney(v: number) {
  if (Number.isNaN(v)) return '0.00'
  return v.toFixed(2)
}

export default function Magazyn() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parts, setParts] = useState<PartType[]>([])


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
  const [orderQty, setOrderQty] = useState<string>('1')
  const [orderNote, setOrderNote] = useState<string>('')
  const [orderError, setOrderError] = useState<string | null>(null)

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

  useEffect(() => {
    loadAll()
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
    setOrderPart(p)
    setOrderError(null)
    setOrderNote('')
    const suggested = Math.max(1, (p.min_stock - p.stock) + 1)
    setOrderQty(String(suggested))
    setOpenOrder(true)
  }

  const closeOrderModal = () => {
    setOpenOrder(false)
    setOrderPart(null)
    setOrderQty('1')
    setOrderNote('')
    setOrderError(null)
  }

  const submitOrder = () => {
    setOrderError(null)
    if (!orderPart) return

    const qty = Math.floor(Number(orderQty))
    if (!Number.isFinite(qty) || qty <= 0) return setOrderError('Podaj ilość > 0')


    alert(
      `Zamówienie (UI):\n\nCzęść: ${orderPart.name}\nSKU: ${orderPart.sku}\nIlość: ${qty}\nNotatka: ${orderNote.trim() || '—'}`
    )
    closeOrderModal()
  }

  return (
    <div className="magazyn-container">
      <div className="magazyn-header">
        <AppButton variant="back" onClick={() => navigate(-1)}>
          ← Wróć
        </AppButton>
        <h1>Magazyn części</h1>
        <div className="m-actions">
          <input
            className="m-search"
            placeholder="Szukaj po nazwie / SKU / marce..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label className="m-toggle">
            <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
            <span>Tylko niskie stany</span>
          </label>
          <button className="m-btn-primary" onClick={openAdd}>
            ➕ Dodaj część
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: 12 }}>⏳ Ładowanie…</div>}
      {error && <div style={{ padding: 12, color: '#ffb3b3' }}>⚠️ {error}</div>}

      {!loading && !error && data.length === 0 && (
        <div style={{ padding: 12, color: '#ddd' }}>Brak części do wyświetlenia.</div>
      )}

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
                Złóż zamówienie (UI)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

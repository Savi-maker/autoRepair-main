import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import './Faktury.css'
import { useAuth } from '../../utils/useAuth'
import { API_URL, getCustomers, getInvoices, createInvoice, updateInvoice, type CustomerType, type InvoiceType } from '../../utils/api'

type UiStatus = 'opłacona' | 'oczekuje' | 'przeterminowana'
type FilterStatus = UiStatus | 'wszystkie'

function baseUrlFromApi(apiUrl: string) {
  return apiUrl.replace(/\/api\/?$/i, '')
}

function toUiStatus(raw: string | null | undefined): UiStatus {
  const s = (raw || '').toLowerCase()
  if (s === 'opłacona' || s === 'paid' || s === 'zaplacona' || s === 'zapłacona') return 'opłacona'
  if (s === 'przeterminowana' || s === 'overdue') return 'przeterminowana'
  return 'oczekuje'
}

function toApiStatus(ui: UiStatus): string {
  if (ui === 'opłacona') return 'opłacona'
  if (ui === 'przeterminowana') return 'przeterminowana'
  return 'oczekuje'
}

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function Faktury() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<FilterStatus>('wszystkie')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [invoices, setInvoices] = useState<InvoiceType[]>([])
  const [customers, setCustomers] = useState<CustomerType[]>([])

  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [iNumber, setINumber] = useState('')
  const [iCustomerId, setICustomerId] = useState<number | ''>('')
  const [iIssueDate, setIIssueDate] = useState(isoToday())
  const [iDueDate, setIDueDate] = useState('')
  const [iAmount, setIAmount] = useState('0')
  const [iStatus, setIStatus] = useState<UiStatus>('oczekuje')

  const [openPreview, setOpenPreview] = useState(false)
  const [selected, setSelected] = useState<InvoiceType | null>(null)

  const [openMark, setOpenMark] = useState(false)
  const [marking, setMarking] = useState(false)
  const [markError, setMarkError] = useState<string | null>(null)
  const [markStatus, setMarkStatus] = useState<UiStatus>('oczekuje')

  const loadAll = async () => {
    setLoading(true)
    setError(null)

    try {
      const [invRes, custRes] = await Promise.all([getInvoices(), getCustomers()])

      if (!invRes.success) {
        setError(invRes.message || 'Błąd faktur')
        setLoading(false)
        return
      }
      if (!custRes.success) {
        setError(custRes.message || 'Błąd klientów')
        setLoading(false)
        return
      }

      setInvoices(invRes.data || [])
      setCustomers(custRes.data || [])
      setLoading(false)
    } catch (e: any) {
      setError(e?.message || 'Network error')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const customerNameById = useMemo(() => {
    const m = new Map<number, string>()
    customers.forEach((c) => m.set(c.id, c.name))
    return m
  }, [customers])

  const rows = useMemo(() => {
    const ql = q.toLowerCase().trim()
    let filtered = invoices

    if (user && (user.rola === 'klient' || user.rola === 'user') && user.customer_id) {
      filtered = filtered.filter((inv) => inv.customer_id === user.customer_id)
    }

    return filtered
      .map((inv) => {
        const ui = toUiStatus(inv.status)
        return { inv, uiStatus: ui, clientName: customerNameById.get(inv.customer_id) || `Klient #${inv.customer_id}` }
      })
      .filter((r) => (status === 'wszystkie' ? true : r.uiStatus === status))
      .filter((r) => {
        if (!ql) return true
        return `${r.inv.number} ${r.clientName}`.toLowerCase().includes(ql)
      })
      .sort((a, b) => (b.inv.issue_date || '').localeCompare(a.inv.issue_date || ''))
  }, [invoices, q, status, customerNameById, user])

  const total = useMemo(() => rows.reduce((s, r) => s + (Number(r.inv.amount) || 0), 0), [rows])

  const resetCreateForm = () => {
    setINumber('')
    setICustomerId('')
    setIIssueDate(isoToday())
    setIDueDate('')
    setIAmount('0')
    setIStatus('oczekuje')
    setCreateError(null)
  }

  const closeCreate = () => {
    if (creating) return
    setOpenCreate(false)
    resetCreateForm()
  }

  const submitCreate = async () => {
    setCreateError(null)

    if (!iCustomerId) return setCreateError('Wybierz klienta')
    const amount = Number(iAmount)
    if (!Number.isFinite(amount) || amount <= 0) return setCreateError('Kwota musi być liczbą > 0')
    if (!iIssueDate) return setCreateError('Uzupełnij datę wystawienia')

    const payload: Partial<InvoiceType> = {
      customer_id: Number(iCustomerId),
      issue_date: iIssueDate,
      due_date: iDueDate.trim() ? iDueDate.trim() : null,
      amount,
      status: toApiStatus(iStatus),
    }

    const num = iNumber.trim()
    if (num) payload.number = num

    setCreating(true)
    const resp = await createInvoice(payload)
    setCreating(false)

    if (!resp.success) {
      setCreateError(resp.message || 'Nie udało się wystawić faktury')
      return
    }

    if (resp.data) {
      setInvoices((prev) => [resp.data as any, ...prev])
    } else {
      await loadAll()
    }

    closeCreate()
  }

  const openPreviewModal = (inv: InvoiceType) => {
    setSelected(inv)
    setOpenPreview(true)
  }

  const closePreview = () => {
    setOpenPreview(false)
    setSelected(null)
  }

  const openMarkModal = (inv: InvoiceType) => {
    setSelected(inv)
    setMarkStatus(toUiStatus(inv.status))
    setMarkError(null)
    setOpenMark(true)
  }

  const closeMark = () => {
    if (marking) return
    setOpenMark(false)
    setMarkError(null)
  }

  const submitMark = async () => {
    if (!selected) return
    setMarkError(null)

    const prev = invoices
    setInvoices((xs) => xs.map((x) => (x.id === selected.id ? { ...x, status: toApiStatus(markStatus) } : x)))

    setMarking(true)
    const resp = await updateInvoice(selected.id, { status: toApiStatus(markStatus) } as any)
    setMarking(false)

    if (!resp.success) {
      setInvoices(prev)
      setMarkError(resp.message || 'Nie udało się zmienić statusu')
      return
    }

    if (resp.data) {
      setInvoices((xs) => xs.map((x) => (x.id === (resp.data as any).id ? (resp.data as any) : x)))
    } else {
      await loadAll()
    }

    closeMark()
  }

  const openPdf = (inv: InvoiceType) => {
    if (!inv.pdf_path) return
    const base = baseUrlFromApi(API_URL)
    const path = inv.pdf_path.startsWith('/') ? inv.pdf_path : `/${inv.pdf_path}`
    window.open(`${base}${path}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="faktury-container">
      <div className="faktury-header">
        <AppButton variant="back" onClick={() => navigate(-1)}>
          ← Wróć
        </AppButton>
        <h1>Faktury</h1>
        <div className="f-actions">
          <input
            className="f-search"
            placeholder="Szukaj po numerze lub kliencie..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="f-select" value={status} onChange={(e) => setStatus(e.target.value as FilterStatus)}>
            <option value="wszystkie">Wszystkie</option>
            <option value="opłacona">Opłacone</option>
            <option value="oczekuje">Oczekujące</option>
            <option value="przeterminowana">Przeterminowane</option>
          </select>
          <button className="f-btn-primary" onClick={() => setOpenCreate(true)}>
            ➕ Wystaw fakturę
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: 12 }}>⏳ Ładowanie…</div>}
      {error && <div style={{ padding: 12, color: '#ffb3b3' }}>⚠️ {error}</div>}

      {!loading && !error && (
        <>
          <div className="summary">
            <div className="sum-card">
              <div className="sum-title">Suma w widoku</div>
              <div className="sum-value">{total.toFixed(2)} zł</div>
            </div>
          </div>

          <div className="invoice-table">
            <div className="i-row i-head">
              <div>Numer</div>
              <div>Klient</div>
              <div>Data</div>
              <div>Kwota</div>
              <div>Status</div>
              <div>Akcje</div>
            </div>

            {rows.map(({ inv, uiStatus, clientName }) => (
              <div key={inv.id} className="i-row">
                <div>{inv.number}</div>
                <div>{clientName}</div>
                <div>{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('pl-PL') : '—'}</div>
                <div>{Number(inv.amount).toFixed(2)} zł</div>
                <div>
                  <span className={`i-status ${uiStatus}`}>{uiStatus}</span>
                </div>
                <div className="i-actions">
                  <button className="btn-secondary" onClick={() => openPreviewModal(inv)}>
                    Podgląd
                  </button>
                  <button className="btn-secondary" onClick={() => openPdf(inv)} disabled={!inv.pdf_path} title={!inv.pdf_path ? 'Brak PDF' : 'Otwórz PDF'}>
                    PDF
                  </button>
                  <button className="f-btn-primary ghost" onClick={() => openMarkModal(inv)}>
                    Oznacz
                  </button>
                </div>
              </div>
            ))}

            {rows.length === 0 && (
              <div style={{ padding: 14, color: '#ddd', background: 'linear-gradient(135deg, #151515 0%, #1e1e1e 100%)' }}>
                Brak faktur w tym widoku.
              </div>
            )}
          </div>
        </>
      )}

      {openCreate && (
        <div
          className="f-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCreate()
          }}
        >
          <div className="f-modal">
            <div className="f-modal-top">
              <h2 className="f-modal-title">Wystaw fakturę</h2>
              <button className="btn-secondary" onClick={closeCreate} disabled={creating}>
                Zamknij
              </button>
            </div>

            <div className="f-modal-grid">
              <div className="f-field">
                <label>Klient</label>
                <select
                  value={iCustomerId}
                  onChange={(e) => setICustomerId(e.target.value ? Number(e.target.value) : '')}
                  disabled={creating}
                >
                  <option value="">Wybierz klienta…</option>
                  {customers
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="f-field">
                <label>Numer (opcjonalnie)</label>
                <input value={iNumber} onChange={(e) => setINumber(e.target.value)} disabled={creating} placeholder="np. FV/12/001" />
              </div>

              <div className="f-field">
                <label>Data wystawienia</label>
                <input type="date" value={iIssueDate} onChange={(e) => setIIssueDate(e.target.value)} disabled={creating} />
              </div>

              <div className="f-field">
                <label>Termin płatności (opcjonalnie)</label>
                <input type="date" value={iDueDate} onChange={(e) => setIDueDate(e.target.value)} disabled={creating} />
              </div>

              <div className="f-field">
                <label>Kwota (zł)</label>
                <input value={iAmount} onChange={(e) => setIAmount(e.target.value)} inputMode="decimal" disabled={creating} />
              </div>

              <div className="f-field">
                <label>Status</label>
                <select value={iStatus} onChange={(e) => setIStatus(e.target.value as UiStatus)} disabled={creating}>
                  <option value="oczekuje">Oczekuje</option>
                  <option value="opłacona">Opłacona</option>
                  <option value="przeterminowana">Przeterminowana</option>
                </select>
              </div>
            </div>

            {createError && <div className="f-modal-msg error">⚠️ {createError}</div>}

            <div className="f-modal-actions">
              <button className="btn-secondary" onClick={closeCreate} disabled={creating}>
                Anuluj
              </button>
              <button className="f-btn-primary" onClick={submitCreate} disabled={creating}>
                {creating ? 'Wystawiam…' : 'Wystaw fakturę'}
              </button>
            </div>
          </div>
        </div>
      )}

      {openPreview && selected && (
        <div
          className="f-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePreview()
          }}
        >
          <div className="f-modal">
            <div className="f-modal-top">
              <h2 className="f-modal-title">Podgląd faktury</h2>
              <button className="btn-secondary" onClick={closePreview}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 10, color: '#ddd' }}>
              <div style={{ fontWeight: 900, color: '#ffcc99', fontSize: 16 }}>{selected.number}</div>
              <div style={{ marginTop: 6 }}>
                <b>Klient:</b> {customerNameById.get(selected.customer_id) || `Klient #${selected.customer_id}`}
              </div>
              <div style={{ marginTop: 6 }}>
                <b>Data wystawienia:</b> {selected.issue_date ? new Date(selected.issue_date).toLocaleDateString('pl-PL') : '—'}
              </div>
              <div style={{ marginTop: 6 }}>
                <b>Termin płatności:</b> {selected.due_date ? new Date(selected.due_date).toLocaleDateString('pl-PL') : '—'}
              </div>
              <div style={{ marginTop: 6 }}>
                <b>Kwota:</b> {Number(selected.amount).toFixed(2)} zł
              </div>
              <div style={{ marginTop: 6 }}>
                <b>Status:</b> <span className={`i-status ${toUiStatus(selected.status)}`}>{toUiStatus(selected.status)}</span>
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn-secondary" onClick={() => openPdf(selected)} disabled={!selected.pdf_path}>
                  Otwórz PDF
                </button>
                <button className="f-btn-primary ghost" onClick={() => openMarkModal(selected)}>
                  Oznacz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openMark && selected && (
        <div
          className="f-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeMark()
          }}
        >
          <div className="f-modal">
            <div className="f-modal-top">
              <h2 className="f-modal-title">Zmień status</h2>
              <button className="btn-secondary" onClick={closeMark} disabled={marking}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 10, color: '#ddd' }}>
              <div style={{ fontWeight: 900, color: '#ffcc99' }}>{selected.number}</div>
              <div style={{ marginTop: 6 }}>
                <b>Klient:</b> {customerNameById.get(selected.customer_id) || `Klient #${selected.customer_id}`}
              </div>
            </div>

            <div className="f-modal-grid" style={{ marginTop: 12 }}>
              <div className="f-field" style={{ gridColumn: '1 / -1' }}>
                <label>Status</label>
                <select value={markStatus} onChange={(e) => setMarkStatus(e.target.value as UiStatus)} disabled={marking}>
                  <option value="oczekuje">Oczekuje</option>
                  <option value="opłacona">Opłacona</option>
                  <option value="przeterminowana">Przeterminowana</option>
                </select>
              </div>
            </div>

            {markError && <div className="f-modal-msg error">⚠️ {markError}</div>}

            <div className="f-modal-actions">
              <button className="btn-secondary" onClick={closeMark} disabled={marking}>
                Anuluj
              </button>
              <button className="f-btn-primary" onClick={submitMark} disabled={marking}>
                {marking ? 'Zapisuję…' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

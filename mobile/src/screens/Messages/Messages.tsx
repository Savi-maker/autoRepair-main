import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import './Messages.css'
import { useAuth } from '../../utils/useAuth'
import {
  getThreads,
  getThreadMessages,
  sendMessage,
  createThread,
  getCustomers,
  getOrders,
  type ThreadType,
  type MessageType,
  type CustomerType,
  type OrderType,
} from '../../utils/api'

type UiMsg = { id: string; role: 'me' | 'other'; text: string; ts: string }

function titleForThread(t: ThreadType) {
  const base = (t.title || '').trim()
  if (base) return base

  const c = (t.customer_name || '').trim()
  const o = (t.order_service || '').trim()
  if (c && o) return `${c} — ${o}`
  if (c) return c
  if (o) return o
  return `Wątek #${t.id}`
}

export default function Messages() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [threads, setThreads] = useState<ThreadType[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)

  const [msgs, setMsgs] = useState<MessageType[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [openNew, setOpenNew] = useState(false)
  const [creating, setCreating] = useState(false)
  const [ntError, setNtError] = useState<string | null>(null)

  const [customers, setCustomers] = useState<CustomerType[]>([])
  const [orders, setOrders] = useState<OrderType[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)

  const [ntCustomerId, setNtCustomerId] = useState<number | ''>('')
  const [ntOrderId, setNtOrderId] = useState<number | ''>('')

  const [ntTitle, setNtTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)

  const convRef = useRef<HTMLDivElement | null>(null)

  const loadThreads = async () => {
    setLoadingThreads(true)
    setError(null)

    const r = await getThreads()
    if (!r.success) {
      setError(r.message || 'Błąd wątków')
      setLoadingThreads(false)
      return
    }

    const list = r.data || []
    setThreads(list)
    setLoadingThreads(false)

    if (!activeId && list.length > 0) setActiveId(list[0].id)
  }

  const loadMessages = async (id: number) => {
    setLoadingMsgs(true)
    setError(null)

    const r = await getThreadMessages(id)
    if (!r.success) {
      setError(r.message || 'Błąd wiadomości')
      setMsgs([])
      setLoadingMsgs(false)
      return
    }

    setMsgs(r.data || [])
    setLoadingMsgs(false)
  }

  useEffect(() => {
    loadThreads()
  }, [])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId])

  const convo: UiMsg[] = useMemo(() => {
    const rows: UiMsg[] = (msgs || [])
      .slice()
      .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
      .map((m) => {
        const role: UiMsg['role'] = m.sender_user_id === user?.id ? 'me' : 'other'
        return {
          id: String(m.id),
          role,
          text: m.text,
          ts: m.created_at || '',
        }
      })
    return rows
  }, [msgs, user?.id])

  useEffect(() => {
    if (!convRef.current) return
    convRef.current.scrollTop = convRef.current.scrollHeight
  }, [convo.length, activeId, loadingMsgs])

  const filteredThreads = useMemo(() => {
    let filtered = threads

    if (user && (user.rola === 'klient' || user.rola === 'user') && user.customer_id) {
      filtered = filtered.filter((t) => t.customer_id === user.customer_id)
    }

    return filtered
  }, [threads, user])

  const activeThread = useMemo(() => {
    if (!activeId) return null
    return filteredThreads.find((t) => t.id === activeId) || null
  }, [filteredThreads, activeId])

  const send = async () => {
    if (!activeId) return
    const v = text.trim()
    if (!v) return

    setText('')
    setSending(true)
    setError(null)

    const r = await sendMessage(activeId, v)
    setSending(false)

    if (!r.success) {
      setError(r.message || 'Nie udało się wysłać')
      await loadMessages(activeId)
      return
    }

    await Promise.all([loadMessages(activeId), loadThreads()])
  }

  const openNewThreadModal = async () => {
    setOpenNew(true)
    setCreating(false)
    setNtError(null)
    setNtCustomerId('')
    setNtOrderId('')
    setNtTitle('')
    setTitleTouched(false)

    setLoadingMeta(true)
    const [cRes, oRes] = await Promise.all([getCustomers(), getOrders()])
    setLoadingMeta(false)

    if (cRes.success) setCustomers(cRes.data || [])
    else setNtError(cRes.message || 'Błąd klientów')

    if (oRes.success) setOrders(oRes.data || [])
    else setNtError((prev) => prev || oRes.message || 'Błąd zleceń')
  }

  const closeNewThreadModal = () => {
    if (creating) return
    setOpenNew(false)
  }

  const selectedCustomer = useMemo(() => {
    if (!ntCustomerId) return null
    return customers.find((c) => c.id === Number(ntCustomerId)) || null
  }, [customers, ntCustomerId])

  const ordersForSelectedCustomer = useMemo(() => {
    if (!ntCustomerId) return []
    return orders
      .filter((o) => o.customer_id === Number(ntCustomerId))
      .slice()
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  }, [orders, ntCustomerId])

  const selectedOrder = useMemo(() => {
    if (!ntOrderId) return null
    return orders.find((o) => o.id === Number(ntOrderId)) || null
  }, [orders, ntOrderId])

  useEffect(() => {
    if (!ntCustomerId) {
      setNtOrderId('')
      return
    }
    if (ntOrderId) {
      const o = orders.find((x) => x.id === Number(ntOrderId))
      if (!o || o.customer_id !== Number(ntCustomerId)) setNtOrderId('')
    }
  }, [ntCustomerId])

  useEffect(() => {
    if (titleTouched) return
    const c = selectedCustomer?.name?.trim()
    const s = selectedOrder?.service?.trim()
    if (c && s) setNtTitle(`${c} — ${s}`)
    else if (c) setNtTitle(c)
    else setNtTitle('')
  }, [selectedCustomer?.id, selectedOrder?.id, titleTouched])

  const submitNewThread = async () => {
    setNtError(null)

    if (!ntCustomerId) {
      setNtError('Wybierz klienta')
      return
    }

    const title = ntTitle.trim()
    if (!title) {
      setNtError('Uzupełnij tytuł')
      return
    }

    setCreating(true)
    const r = await createThread({
      title,
      customer_id: Number(ntCustomerId),
      order_id: ntOrderId ? Number(ntOrderId) : undefined,
    })
    setCreating(false)

    if (!r.success || !r.data) {
      setNtError(r.message || 'Nie udało się utworzyć wątku')
      return
    }

    setOpenNew(false)
    await loadThreads()
    setActiveId(r.data.id)
  }

  return (
    <div className="msg-container">
      <div className="msg-left">
        <div className="msg-left-head">
          <AppButton variant="back" onClick={() => navigate(-1)} style={{ marginRight: 8 }}>
            ← Wróć
          </AppButton>
          Wiadomości
        </div>

        <button className="msg-btn-primary" onClick={openNewThreadModal}>
          ➕ Nowy wątek
        </button>

        {loadingThreads && <div style={{ padding: 10, color: '#ddd' }}>⏳ Ładowanie…</div>}
        {error && <div style={{ padding: 10, color: '#ffb3b3' }}>⚠️ {error}</div>}

        <div className="thread-list">
          {filteredThreads.map((t) => (
            <button
              key={t.id}
              className={`thread ${t.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(t.id)}
            >
              <div className="t-title">{titleForThread(t)}</div>
              <div className="t-last">{t.last_message_text || '—'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="msg-right">
        <div className="msg-topbar">
          <div className="msg-top-title">{activeThread ? titleForThread(activeThread) : 'Wybierz wątek'}</div>
          <div className="msg-top-sub">
            {activeThread?.last_message_at ? `Ostatnia: ${new Date(activeThread.last_message_at).toLocaleString('pl-PL')}` : ' '}
          </div>
        </div>

        <div className="conv" ref={convRef}>
          {loadingMsgs && <div style={{ padding: 10, color: '#ddd' }}>⏳ Ładowanie…</div>}
          {convo.map((m) => (
            <div key={m.id} className={`line ${m.role}`}>
              <div className="bubble">{m.text}</div>
              <div className="ts">{m.ts ? new Date(m.ts).toLocaleString('pl-PL') : ''}</div>
            </div>
          ))}
        </div>

        <div className="composer">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={activeId ? 'Napisz wiadomość…' : 'Wybierz wątek'}
            disabled={!activeId || sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
          />
          <button className="msg-btn-primary" onClick={send} disabled={!activeId || sending || !text.trim()}>
            {sending ? 'Wysyłanie…' : 'Wyślij'}
          </button>
        </div>
      </div>

      {openNew && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeNewThreadModal()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 'min(760px,100%)',
              background: 'linear-gradient(135deg, #151515 0%, #222 100%)',
              borderRadius: 14,
              padding: 18,
              border: '1px solid rgba(255,102,0,0.2)',
              color: '#fff',
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ color: '#ff6600', margin: 0 }}>Nowy wątek</h2>
              <button className="btn-secondary" onClick={closeNewThreadModal} disabled={creating}>
                Zamknij
              </button>
            </div>

            {loadingMeta && <div style={{ marginTop: 10, color: '#ddd' }}>⏳ Ładowanie klientów i zleceń…</div>}

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: 6, color: '#ffcc99' }}>Klient</label>
                <select
                  value={ntCustomerId}
                  onChange={(e) => setNtCustomerId(e.target.value ? Number(e.target.value) : '')}
                  disabled={creating || loadingMeta}
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

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: 6, color: '#ffcc99' }}>
                  Zlecenie (opcjonalnie)
                </label>
                <select
                  value={ntOrderId}
                  onChange={(e) => setNtOrderId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!ntCustomerId || creating || loadingMeta}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,102,0,0.18)',
                    background: !ntCustomerId ? '#161616' : '#0f0f0f',
                    color: '#fff',
                    opacity: !ntCustomerId ? 0.7 : 1,
                  }}
                >
                  <option value="">{ntCustomerId ? 'Powiąż ze zleceniem… (opcjonalnie)' : 'Najpierw wybierz klienta'}</option>
                  {ordersForSelectedCustomer.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} • {o.service} • {new Date(o.created_at).toLocaleDateString('pl-PL')}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: 6, color: '#ffcc99' }}>Tytuł</label>
                <input
                  value={ntTitle}
                  onChange={(e) => {
                    setNtTitle(e.target.value)
                    setTitleTouched(true)
                  }}
                  disabled={creating || loadingMeta}
                  placeholder="np. Jan Kowalski — Diagnostyka"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#0f0f0f',
                    border: '1px solid rgba(255,102,0,0.18)',
                    color: '#fff',
                  }}
                />
              </div>
            </div>

            {ntError && <div style={{ marginTop: 12, color: '#ffb3b3' }}>⚠️ {ntError}</div>}

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeNewThreadModal} disabled={creating}>
                Anuluj
              </button>
              <button className="msg-btn-primary" onClick={submitNewThread} disabled={creating || loadingMeta}>
                {creating ? 'Tworzenie…' : 'Utwórz wątek'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

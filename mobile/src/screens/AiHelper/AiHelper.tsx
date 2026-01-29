import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import './AiHelper.css'
import { orders, vehicles } from '../../utils/mockData'

const SUGGESTIONS = [
  { key: 'olej', tip: 'Wymień filtr oleju razem z olejem; po wymianie wyzeruj licznik inspekcji.' },
  { key: 'hamulc', tip: 'Po wymianie klocków sprawdź grubość tarcz i odpowietrz układ.' },
  { key: 'akumulator', tip: 'Sprawdź prąd rozruchowy i ładowanie alternatora (13.8–14.4V).' },
  { key: 'zawies', tip: 'Diagnostyka: luz na sworzniach, łączniki stabilizatora, odbojnik amortyzatora.' },
]

export default function AiHelper() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [log, setLog] = useState<{ role:'user'|'ai', text:string }[]>([
    { role:'ai', text:'Cześć! Opisz objawy, a podpowiem możliwe przyczyny i kroki diagnostyczne.' }
  ])

  const related = useMemo(() => {
    const ql = q.toLowerCase()
    if (!ql) return []
    return orders.slice(0, 5).map(o => {
      const v = vehicles.find(v => v.id === o.vehicleId)
      return `${v ? `${v.make} ${v.model}` : 'Pojazd'} • ${o.service}`
    })
  }, [q])

  const reply = (input: string) => {
    const lower = input.toLowerCase()
    const hits = SUGGESTIONS.filter(s => lower.includes(s.key))
    const tips = hits.length
      ? hits.map(h => `• ${h.tip}`).join('\n')
      : '• Sprawdź błędy OBD-II\n• Zweryfikuj historię ostatnich napraw\n• Wykonaj jazdę próbną i rejestr danych'
    return `Możliwe kroki:\n${tips}`
  }

  const send = () => {
    if (!q.trim()) return
    const r = reply(q)
    setLog(prev => [...prev, { role:'user', text:q.trim() }, { role:'ai', text:r }])
    setQ('')
  }

  return (
    <div className="ai-container">
      <div className="ai-header">
        <AppButton variant="back" onClick={() => navigate(-1)}>
          ← Wróć
        </AppButton>
        <h1>AI Pomocnik serwisowy</h1>
      </div>

      <div className="ai-chat">
        {log.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
      </div>

      {related.length > 0 && (
        <div className="ai-hints">
          <div className="hint-title">Powiązane w systemie:</div>
          <ul>
            {related.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

      <div className="ai-input">
        <textarea
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Np. drgania kierownicy przy hamowaniu powyżej 80 km/h…"
        />
        <button className="ai-btn-primary" onClick={send}>Zapytaj</button>
      </div>
    </div>
  )
}

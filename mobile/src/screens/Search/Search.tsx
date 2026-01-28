import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import './Search.css'
import { orders, vehicles, customers } from '../../utils/mockData'
import StatusBadge from '../../components/StatusBadge'

const Search: React.FC = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query) return []
    const q = query.toLowerCase()
    return orders.filter(o => {
      const v = vehicles.find(x => x.id === o.vehicleId)
      const c = customers.find(x => x.id === o.customerId)
      const text = `${o.service} ${o.mechanic} ${v?.make} ${v?.model} ${v?.plate} ${c?.name}`.toLowerCase()
      return text.includes(q)
    })
  }, [query])

  return (
    <div className="search-container">
      <header className="search-header">
        <AppButton variant="back" onClick={() => navigate(-1)}>
          ← Wróć
        </AppButton>
        <h1>Wyszukiwarka</h1>
      </header>

      <div className="search-bar">
        <input
          className="search-input-lg"
          placeholder="Szukaj po pojeździe, kliencie, usłudze..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!query && (
        <div className="hint-card">
          <p>Wpisz nazwę klienta, model pojazdu lub usługę, aby rozpocząć wyszukiwanie.</p>
        </div>
      )}

      {query && results.length === 0 && (
        <div className="hint-card">
          <p>Brak wyników dla „{query}”.</p>
        </div>
      )}

      <div className="results-grid">
        {results.map(o => {
          const v = vehicles.find(x => x.id === o.vehicleId)
          const c = customers.find(x => x.id === o.customerId)
          return (
            <div key={o.id} className="result-card">
              <div className="result-top">
                <div className="result-title">{v ? `${v.make} ${v.model} ${v.year}` : 'Pojazd'}</div>
                <StatusBadge status={o.status} />
              </div>
              <div className="result-meta"><b>Usługa:</b> {o.service}</div>
              <div className="result-meta"><b>Mechanik:</b> {o.mechanic}</div>
              <div className="result-meta"><b>Data:</b> {new Date(o.startDate).toLocaleString()}</div>
              <div className="result-meta"><b>Klient:</b> {c?.name ?? '—'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Search

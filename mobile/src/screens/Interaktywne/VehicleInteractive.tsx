import React, { useMemo, useState } from 'react'
import './VehicleInteractive.css'

type PartKey =
  | 'engine'
  | 'brakes'
  | 'suspension'
  | 'tires'
  | 'battery'
  | 'lights'
  | 'oil'
  | 'cooling'
  | 'exhaust'

type PartStatus = 'ok' | 'uwaga' | 'do_wymiany'

type PartMeta = {
  key: PartKey
  name: string
  desc: string
}

type SelectedPart = {
  key: PartKey
  status: PartStatus
  note: string
}

const PARTS: PartMeta[] = [
  { key: 'engine', name: 'Silnik', desc: 'Praca, dźwięki, wycieki, odczyty' },
  { key: 'oil', name: 'Układ olejowy', desc: 'Olej, filtr oleju, wycieki, interwał' },
  { key: 'cooling', name: 'Chłodzenie', desc: 'Płyn, termostat, chłodnica, wentylator' },
  { key: 'battery', name: 'Akumulator', desc: 'Napięcie, ładowanie, klemy' },
  { key: 'brakes', name: 'Hamulce', desc: 'Klocki, tarcze, płyn, przewody' },
  { key: 'suspension', name: 'Zawieszenie', desc: 'Amortyzatory, tuleje, przeguby' },
  { key: 'tires', name: 'Opony', desc: 'Bieżnik, ciśnienie, nierównomierne zużycie' },
  { key: 'lights', name: 'Oświetlenie', desc: 'Żarówki, LED, kierunkowskazy' },
  { key: 'exhaust', name: 'Wydech', desc: 'Szczelność, tłumik, sondy' },
]

function statusLabel(s: PartStatus) {
  if (s === 'ok') return 'OK'
  if (s === 'uwaga') return 'Uwaga'
  return 'Do wymiany'
}

export default function VehicleInteractive() {
  const [hover, setHover] = useState<PartKey | null>(null)
  const [active, setActive] = useState<PartKey | null>(null)

  const [selected, setSelected] = useState<Record<PartKey, SelectedPart>>(() => {
    const init: any = {}
    for (const p of PARTS) init[p.key] = { key: p.key, status: 'ok', note: '' }
    return init
  })

  const activeMeta = useMemo(() => PARTS.find((p) => p.key === active) || null, [active])

  const setPartStatus = (key: PartKey, status: PartStatus) => {
    setSelected((prev) => ({ ...prev, [key]: { ...prev[key], status } }))
  }

  const setPartNote = (key: PartKey, note: string) => {
    setSelected((prev) => ({ ...prev, [key]: { ...prev[key], note } }))
  }

  const summary = useMemo(() => {
    const values = Object.values(selected)
    const warn = values.filter((x) => x.status === 'uwaga').length
    const bad = values.filter((x) => x.status === 'do_wymiany').length
    return { warn, bad }
  }, [selected])

  const pick = (key: PartKey) => {
    setActive(key)
  }

  const resetAll = () => {
    setSelected(() => {
      const init: any = {}
      for (const p of PARTS) init[p.key] = { key: p.key, status: 'ok', note: '' }
      return init
    })
    setActive(null)
    setHover(null)
  }

  const exportReport = () => {
    const rows = Object.values(selected)
      .filter((x) => x.status !== 'ok' || (x.note && x.note.trim()))
      .map((x) => {
        const meta = PARTS.find((p) => p.key === x.key)
        return {
          part: meta?.name || x.key,
          status: x.status,
          note: x.note || '',
        }
      })

    alert(
      rows.length
        ? `Raport (mock):\n\n${rows
            .map((r) => `• ${r.part}: ${statusLabel(r.status as any)}${r.note ? ` — ${r.note}` : ''}`)
            .join('\n')}`
        : 'Brak uwag — wszystko OK.'
    )
  }

  const partClass = (key: PartKey) => {
    const s = selected[key].status
    const isActive = active === key
    const isHover = hover === key
    return [
      'part',
      `st-${s}`,
      isActive ? 'active' : '',
      isHover ? 'hover' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <div className="vi-page">
      <div className="vi-header">
        <div className="vi-title">
          <div className="vi-h1">Interaktywny pojazd</div>
          <div className="vi-sub">
            Kliknij element auta, aby go oznaczyć i dodać notatkę. (Mock — podepniemy do zlecenia / historii)
          </div>
        </div>

        <div className="vi-actions">
          <div className="vi-badges">
            <span className="badge warn">Uwaga: {summary.warn}</span>
            <span className="badge bad">Do wymiany: {summary.bad}</span>
          </div>
          <button className="btn secondary" onClick={exportReport}>Eksportuj raport</button>
          <button className="btn danger" onClick={resetAll}>Reset</button>
        </div>
      </div>

      <div className="vi-grid">
        <div className="vi-canvas">
          <div className="vi-canvas-title">Schemat auta</div>

          <svg
            className="car-svg"
            viewBox="0 0 900 520"
            role="img"
            aria-label="Schemat samochodu"
          >
            <defs>
              <linearGradient id="gBody" x1="0" x2="1">
                <stop offset="0" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="1" stopColor="rgba(255,255,255,0.02)" />
              </linearGradient>
            </defs>

            <rect x="70" y="90" width="760" height="340" rx="36" fill="url(#gBody)" className="car-body" />
            <rect x="180" y="130" width="540" height="90" rx="26" fill="rgba(255,255,255,0.04)" />
            <circle cx="210" cy="410" r="48" fill="rgba(255,255,255,0.08)" />
            <circle cx="690" cy="410" r="48" fill="rgba(255,255,255,0.08)" />

            <g
              className={partClass('engine')}
              onMouseEnter={() => setHover('engine')}
              onMouseLeave={() => setHover(null)}
              onClick={() => pick('engine')}
            >
              <rect x="210" y="240" width="220" height="120" rx="18" />
              <text x="320" y="308" textAnchor="middle">Silnik</text>
            </g>

            <g
              className={partClass('oil')}
              onMouseEnter={() => setHover('oil')}
              onMouseLeave={() => setHover(null)}
              onClick={() => pick('oil')}
            >
              <rect x="455" y="255" width="120" height="80" rx="16" />
              <text x="515" y="302" textAnchor="middle">Olej</text>
            </g>

            <g
              className={partClass('cooling')}
              onMouseEnter={() => setHover('cooling')}
              onMouseLeave={() => setHover(null)}
              onClick={() => pick('cooling')}
            >
              <rect x="590" y="240" width="150" height="60" rx="14" />
              <text x="665" y="278" textAnchor="middle">Chłodzenie</text>
            </g>

            <g
              className={partClass('battery')}
              onMouseEnter={() => setHover('battery')}
              onMouseLeave={() => setHover(null)}
              onClick={() => pick('battery')}
            >
              <rect x="600" y="320" width="140" height="70" rx="14" />
              <text x="670" y="362" textAnchor="middle">Akumulator</text>
            </g>

            <g
              className={partClass('brakes')}
              onMouseEnter={() => setHover('brakes')}
              onMouseLeave={() => setHover(null)}
              onClick={() => pick('brakes')}
            >
              <rect x="140" y="360" width="150" height="60" rx="14" />
              <text x="215" y="398" textAnchor="middle">Hamulce</text>
            </g>

            <g
              className={partClass('suspension')}
              onMouseEnter={() => setHover('suspension')}
              onMouseLeave={() => setHover(null)}
              onClick={() => pick('suspension')}
            >
              <rect x="300" y="370" width="180" height="50" rx="14" />
              <text x="390" y="402" textAnchor="middle">Zawieszenie</text>
            </g>

            <g
              className={partClass('tires')}
              onMouseEnter={() => setHover('tires')}
              onMouseLeave={() => setHover(null)}
              onClick={() => pick('tires')}
            >
              <rect x="520" y="370" width="150" height="50" rx="14" />
              <text x="595" y="402" textAnchor="middle">Opony</text>
            </g>

            <g
              className={partClass('lights')}
              onMouseEnter={() => setHover('lights')}
              onMouseLeave={() => setHover(null)}
              onClick={() => pick('lights')}
            >
              <rect x="120" y="150" width="130" height="60" rx="14" />
              <text x="185" y="188" textAnchor="middle">Światła</text>
            </g>

            <g
              className={partClass('exhaust')}
              onMouseEnter={() => setHover('exhaust')}
              onMouseLeave={() => setHover(null)}
              onClick={() => pick('exhaust')}
            >
              <rect x="700" y="390" width="120" height="40" rx="14" />
              <text x="760" y="415" textAnchor="middle">Wydech</text>
            </g>
          </svg>

          <div className="vi-hint">
            Tip: kliknij element, potem ustaw status po prawej. Na hover pokaże się podświetlenie.
          </div>
        </div>

        <div className="vi-panel">
          <div className="panel-title">Panel elementu</div>

          {!active || !activeMeta ? (
            <div className="panel-empty">
              <div className="panel-empty-title">Wybierz część auta</div>
              <div className="panel-empty-sub">
                Kliknij element na schemacie, aby zmienić status i dodać notatkę.
              </div>

              <div className="panel-list">
                {PARTS.map((p) => (
                  <button key={p.key} className="panel-item" onClick={() => pick(p.key)}>
                    <div className="panel-item-main">
                      <div className="panel-item-name">{p.name}</div>
                      <div className="panel-item-desc">{p.desc}</div>
                    </div>
                    <div className={`pill st-${selected[p.key].status}`}>{statusLabel(selected[p.key].status)}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="panel-body">
              <div className="panel-head">
                <div>
                  <div className="panel-part-name">{activeMeta.name}</div>
                  <div className="panel-part-desc">{activeMeta.desc}</div>
                </div>
                <div className={`pill st-${selected[active].status}`}>{statusLabel(selected[active].status)}</div>
              </div>

              <div className="panel-section">
                <div className="section-title">Status</div>
                <div className="status-row">
                  <button
                    className={`btn status ${selected[active].status === 'ok' ? 'active' : ''}`}
                    onClick={() => setPartStatus(active, 'ok')}
                  >
                    OK
                  </button>
                  <button
                    className={`btn status ${selected[active].status === 'uwaga' ? 'active' : ''}`}
                    onClick={() => setPartStatus(active, 'uwaga')}
                  >
                    Uwaga
                  </button>
                  <button
                    className={`btn status ${selected[active].status === 'do_wymiany' ? 'active' : ''}`}
                    onClick={() => setPartStatus(active, 'do_wymiany')}
                  >
                    Do wymiany
                  </button>
                </div>
              </div>

              <div className="panel-section">
                <div className="section-title">Notatka</div>
                <textarea
                  className="note"
                  value={selected[active].note}
                  onChange={(e) => setPartNote(active, e.target.value)}
                  placeholder="np. Tarcze z przodu do wymiany w ciągu 2 tygodni"
                  rows={5}
                />
              </div>

              <div className="panel-section">
                <div className="section-title">Akcje</div>
                <div className="panel-actions">
                  <button className="btn primary" onClick={() => alert('Mock: dodamy do zlecenia / raportu')}>
                    Dodaj do zlecenia
                  </button>
                  <button className="btn secondary" onClick={() => alert('Mock: pokażemy historię napraw tej części')}>
                    Historia
                  </button>
                  <button className="btn secondary" onClick={() => setActive(null)}>
                    Zamknij panel
                  </button>
                </div>
              </div>

              <div className="panel-section">
                <div className="section-title">Szybkie wskazówki</div>
                <div className="tips">
                  <div className="tip-row">• Kliknij inne elementy — zapisane statusy zostaną.</div>
                  <div className="tip-row">• Eksport raportu zbierze tylko elementy z uwagami.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

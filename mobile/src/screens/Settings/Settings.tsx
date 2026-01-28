import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import './Settings.css'

const Settings: React.FC = () => {
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [notifications, setNotifications] = useState(true)
  const [lang, setLang] = useState<'pl' | 'en'>('pl')

  return (
    <div className="settings-container">
      <header className="settings-header">
        <AppButton variant="back" onClick={() => navigate(-1)}>
          ← Wróć
        </AppButton>
        <h1>Ustawienia</h1>
      </header>

      <div className="settings-grid">
        <section className="settings-card">
          <h3>Wygląd</h3>
          <div className="setting-row">
            <label>Motyw aplikacji</label>
            <select className="setting-select" value={theme} onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}>
              <option value="dark">Ciemny</option>
              <option value="light">Jasny</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Język</label>
            <select className="setting-select" value={lang} onChange={(e) => setLang(e.target.value as 'pl' | 'en')}>
              <option value="pl">Polski</option>
              <option value="en">English</option>
            </select>
          </div>
        </section>

        <section className="settings-card">
          <h3>Powiadomienia</h3>
          <div className="setting-row">
            <label>Wizyty i terminy</label>
            <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
          </div>
          <div className="setting-row">
            <label>Raporty i statusy zleceń</label>
            <input type="checkbox" defaultChecked />
          </div>
        </section>

      </div>
    </div>
  )
}

export default Settings

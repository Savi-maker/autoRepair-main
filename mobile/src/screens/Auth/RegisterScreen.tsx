import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerProfile } from '../../utils/api'
import { hashPassword, validateEmail, validatePasswordStrength } from '../../utils/helpers'
import './Auth.css'

const RegisterScreen: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [imie, setImie] = useState('')
  const [nazwisko, setNazwisko] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getPasswordStrength = (value: string): { level: 'weak' | 'medium' | 'strong'; label: string } => {
    let score = 0

    if (value.length >= 8) score += 1
    if (/[A-Z]/.test(value)) score += 1
    if (/[a-z]/.test(value)) score += 1
    if (/[0-9]/.test(value)) score += 1
    if (/[^A-Za-z0-9]/.test(value)) score += 1

    if (score >= 4) return { level: 'strong', label: 'Silne' }
    if (score >= 2) return { level: 'medium', label: 'Średnie' }
    return { level: 'weak', label: 'Słabe' }
  }

  const getPasswordRequirements = (value: string) => ({
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value)
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const mail = email.trim()
    const first = imie.trim()
    const last = nazwisko.trim()

    if (!mail || !first || !last || !password || !confirmPassword) {
      setError('Wszystkie pola są wymagane')
      return
    }

    if (!validateEmail(mail)) {
      setError('Proszę podać prawidłowy adres email')
      return
    }

    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message)
      return
    }

    if (password !== confirmPassword) {
      setError('Hasła nie są zgodne')
      return
    }

    setLoading(true)
    try {
      const hashedPassword = await hashPassword(password)
      const resp = await registerProfile({ imie: first, nazwisko: last, mail, haslo: hashedPassword })
      if (resp.success) {
        setSuccess('Rejestracja pomyślna! Możesz się teraz zalogować.')
        setTimeout(() => navigate('/login'), 900)
      } else {
        setError(resp.message || 'Rejestracja nie powiodła się')
      }
    } catch (err) {
      setError('Błąd połączenia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>🔧 AutoRepair</h1>
        <h2>Rejestracja nowego konta</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="email">Adres email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Wpisz swój email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="imie">Imię:</label>
            <input
              id="imie"
              type="text"
              value={imie}
              onChange={(e) => setImie(e.target.value)}
              placeholder="Wpisz swoje imię"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="nazwisko">Nazwisko:</label>
            <input
              id="nazwisko"
              type="text"
              value={nazwisko}
              onChange={(e) => setNazwisko(e.target.value)}
              placeholder="Wpisz swoje nazwisko"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz hasło"
              disabled={loading}
            />
            {password && (
              <div className={`password-strength password-strength--${getPasswordStrength(password).level}`}>
                Siła hasła: <span>{getPasswordStrength(password).label}</span>
              </div>
            )}
            {password && (
              <div className="password-requirements">
                <div className={getPasswordRequirements(password).length ? 'req req--ok' : 'req req--bad'}>
                  • Minimum 8 znaków
                </div>
                <div className={getPasswordRequirements(password).uppercase ? 'req req--ok' : 'req req--bad'}>
                  • Wielka litera
                </div>
                <div className={getPasswordRequirements(password).number ? 'req req--ok' : 'req req--bad'}>
                  • Cyfra
                </div>
                <div className={getPasswordRequirements(password).special ? 'req req--ok' : 'req req--bad'}>
                  • Znak specjalny
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Powtórz hasło:</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Powtórz hasło"
              disabled={loading}
            />
            {confirmPassword && (
              <div
                className={`password-match ${password === confirmPassword ? 'password-match--ok' : 'password-match--bad'}`}
              >
                {password === confirmPassword ? 'Hasła są zgodne' : 'Hasła są różne'}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Rejestracja w toku...' : 'Zarejestruj się'}
          </button>
        </form>

        <div className="auth-links">
          <button type="button" onClick={() => navigate('/login')} className="link-button">
            Masz już konto? Zaloguj się
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegisterScreen

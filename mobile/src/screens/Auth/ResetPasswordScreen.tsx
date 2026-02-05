import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPassword } from '../../utils/api'
import { hashPassword, validateEmail, validatePasswordStrength } from '../../utils/helpers'
import './Auth.css'

const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [imie, setImie] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const mail = email.trim()
    const first = imie.trim()

    if (!mail || !first || !newPassword || !confirmPassword) {
      setError('Wszystkie pola są wymagane')
      return
    }

    if (!validateEmail(mail)) {
      setError('Proszę podać prawidłowy adres email')
      return
    }

    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Hasła nie są zgodne')
      return
    }

    setLoading(true)
    try {
      const hashedPassword = await hashPassword(newPassword)
      const resp = await resetPassword({ mail, imie: first, nowe_haslo: hashedPassword })
      if (resp.success) {
        setSuccess('Hasło zostało zmienione pomyślnie!')
        setTimeout(() => navigate('/login'), 900)
      } else {
        setError(resp.message || 'Wystąpił błąd podczas resetowania hasła')
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
        <h2>Reset hasła</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleResetPassword}>
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
            <label htmlFor="newPassword">Nowe hasło:</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Wpisz nowe hasło"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Powtórz hasło:</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Powtórz nowe hasło"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Przetwarzanie...' : 'Zmień hasło'}
          </button>
        </form>

        <div className="auth-links">
          <button type="button" onClick={() => navigate('/login')} className="link-button">
            Powrót do logowania
          </button>
          <button type="button" onClick={() => navigate('/register')} className="link-button">
            Nie masz konta? Zarejestruj się
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordScreen

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../utils/api'
import { hashPassword, validateEmail } from '../../utils/helpers'
import './Auth.css'

const LoginScreen: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Proszę wypełnić wszystkie pola')
      return
    }

    if (!validateEmail(email)) {
      setError('Proszę podać prawidłowy adres email')
      return
    }

    setLoading(true)
    try {
      const hashedPassword = await hashPassword(password)
      const response = await login(email, hashedPassword)
      if (response.success) {
        setSuccess('Zalogowano pomyślnie!')
        setTimeout(() => navigate('/home'), 600)
      } else {
        setError(response.message || 'Logowanie nie powiodło się')
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
        <h2>Logowanie do systemu</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleLogin}>
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
            <label htmlFor="password">Hasło:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz swoje hasło"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logowanie w toku...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="auth-links">
          <button type="button" onClick={() => navigate('/reset-password')} className="link-button">
            Zapomniałem hasła
          </button>
          <button type="button" onClick={() => navigate('/register')} className="link-button">
            Rejestracja nowego konta
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen

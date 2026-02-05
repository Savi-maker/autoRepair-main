import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../../components/AppButton/AppButton'
import './AdminUsers.css'
import {
  getUsersAdmin,
  createUserAdmin,
  updateUserAdmin,
  adminResetUserPassword,
  type AdminUserType,
} from '../../utils/api'

type UserRole = 'admin' | 'kierownik' | 'mechanik' | 'recepcja' | 'klient'
type UserStatus = 'aktywny' | 'zablokowany'

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrator',
  kierownik: 'Kierownik',
  mechanik: 'Mechanik',
  recepcja: 'Recepcja',
  klient: 'Klient',
}

function toRole(v: any): UserRole {
  const r = String(v ?? '').toLowerCase()
  if (r === 'admin' || r === 'administrator') return 'admin'
  if (r === 'kierownik' || r === 'manager') return 'kierownik'
  if (r === 'mechanik' || r === 'mechanic') return 'mechanik'
  if (r === 'recepcja' || r === 'receptionist') return 'recepcja'
  if (r === 'klient' || r === 'client') return 'klient'
  return 'klient'
}

function toStatus(v: any): UserStatus {
  const s = String(v ?? '').toLowerCase()
  if (s === 'zablokowany' || s === 'blocked' || s === 'ban' || s === 'disabled') return 'zablokowany'
  return 'aktywny'
}

function displayName(u: AdminUserType) {
  const a = (u.imie ?? '').trim()
  const b = (u.nazwisko ?? '').trim()
  const n = `${a} ${b}`.trim()
  return n || u.mail || `Użytkownik #${u.id}`
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<UserRole | 'wszyscy'>('wszyscy')
  const [status, setStatus] = useState<UserStatus | 'wszyscy'>('wszyscy')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [users, setUsers] = useState<AdminUserType[]>([])

  const [openAdd, setOpenAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [aImie, setAImie] = useState('')
  const [aNazwisko, setANazwisko] = useState('')
  const [aMail, setAMail] = useState('')
  const [aTelefon, setATelefon] = useState('')
  const [aHaslo, setAHaslo] = useState('')
  const [aRola, setARola] = useState<UserRole>('klient')

  const [openReset, setOpenReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetPass, setResetPass] = useState('')
  const [resetUser, setResetUser] = useState<AdminUserType | null>(null)

  const [openRoleChange, setOpenRoleChange] = useState(false)
  const [changingRole, setChangingRole] = useState(false)
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null)
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('klient')
  const [roleChangeUser, setRoleChangeUser] = useState<AdminUserType | null>(null)

  const loadAll = async () => {
    setLoading(true)
    setError(null)

    const resp = await getUsersAdmin()
    if (!resp.success) {
      setError(resp.message || 'Błąd pobierania użytkowników')
      setLoading(false)
      return
    }

    setUsers(resp.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return users
      .map((u) => ({
        ...u,
        _role: toRole(u.rola),
        _status: toStatus((u as any).status),
        _name: displayName(u),
      }))
      .filter((u) => (role === 'wszyscy' ? true : u._role === role))
      .filter((u) => (status === 'wszyscy' ? true : u._status === status))
      .filter((u) => {
        if (!ql) return true
        const phone = String(u.telefon ?? '')
        return (
          u._name.toLowerCase().includes(ql) ||
          String(u.mail ?? '').toLowerCase().includes(ql) ||
          phone.toLowerCase().includes(ql)
        )
      })
      .sort((a, b) => a._name.localeCompare(b._name))
  }, [q, role, status, users])

  const closeAdd = () => {
    if (adding) return
    setOpenAdd(false)
    setAddError(null)
    setAImie('')
    setANazwisko('')
    setAMail('')
    setATelefon('')
    setAHaslo('')
    setARola('klient')
  }

  const submitAdd = async () => {
    setAddError(null)

    const imie = aImie.trim()
    const nazwisko = aNazwisko.trim()
    const mail = aMail.trim()
    const telefon = aTelefon.trim()
    const haslo = aHaslo

    if (!imie) return setAddError('Uzupełnij pole: Imię')
    if (!nazwisko) return setAddError('Uzupełnij pole: Nazwisko')
    if (!mail) return setAddError('Uzupełnij pole: Email')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setAddError('Nieprawidłowy email')
    if (!haslo || haslo.length < 6) return setAddError('Hasło musi mieć min. 6 znaków')

    setAdding(true)
    const resp = await createUserAdmin({ imie, nazwisko, mail, telefon: telefon || undefined, haslo, rola: aRola })
    setAdding(false)

    if (!resp.success) {
      setAddError(resp.message || 'Nie udało się dodać użytkownika')
      return
    }

    if (resp.data) {
      setUsers((prev) => [resp.data as any, ...prev])
    } else {
      await loadAll()
    }

    closeAdd()
  }

  const toggleStatus = async (u: AdminUserType) => {
    const current = toStatus((u as any).status)
    const next: UserStatus = current === 'aktywny' ? 'zablokowany' : 'aktywny'

    const prev = users
    setUsers((xs) => xs.map((x) => (x.id === u.id ? ({ ...x, status: next } as any) : x)))

    const resp = await updateUserAdmin(u.id, { status: next })
    if (!resp.success) {
      setUsers(prev)
      alert(resp.message || 'Nie udało się zmienić statusu')
      return
    }

    if (resp.data) setUsers((xs) => xs.map((x) => (x.id === (resp.data as any).id ? (resp.data as any) : x)))
  }

  const makeAdmin = async (u: AdminUserType) => {
    const ok = window.confirm(`Nadać uprawnienia administratora użytkownikowi: ${displayName(u)}?`)
    if (!ok) return

    const prev = users
    setUsers((xs) => xs.map((x) => (x.id === u.id ? ({ ...x, rola: 'admin' } as any) : x)))

    const resp = await updateUserAdmin(u.id, { rola: 'admin' })
    if (!resp.success) {
      setUsers(prev)
      alert(resp.message || 'Nie udało się zmienić roli')
      return
    }

    if (resp.data) setUsers((xs) => xs.map((x) => (x.id === (resp.data as any).id ? (resp.data as any) : x)))
  }

  const openRoleChangeModal = (u: AdminUserType) => {
    const currentRole = toRole(u.rola)
    setRoleChangeUser(u)
    setSelectedNewRole(currentRole)
    setRoleChangeError(null)
    setOpenRoleChange(true)
  }

  const closeRoleChange = () => {
    if (changingRole) return
    setOpenRoleChange(false)
    setRoleChangeUser(null)
    setSelectedNewRole('klient')
    setRoleChangeError(null)
  }

  const submitRoleChange = async () => {
    if (!roleChangeUser) return
    
    const currentRole = toRole(roleChangeUser.rola)
    if (currentRole === selectedNewRole) {
      closeRoleChange()
      return
    }

    setChangingRole(true)
    setRoleChangeError(null)

    const prev = users
    setUsers((xs) => xs.map((x) => (x.id === roleChangeUser.id ? ({ ...x, rola: selectedNewRole } as any) : x)))

    const resp = await updateUserAdmin(roleChangeUser.id, { rola: selectedNewRole })
    setChangingRole(false)

    if (!resp.success) {
      setUsers(prev)
      setRoleChangeError(resp.message || 'Nie udało się zmienić roli')
      return
    }

    if (resp.data) setUsers((xs) => xs.map((x) => (x.id === (resp.data as any).id ? (resp.data as any) : x)))
    closeRoleChange()
  }

  const openResetModal = (u: AdminUserType) => {
    setResetUser(u)
    setResetPass('')
    setResetError(null)
    setOpenReset(true)
  }

  const closeReset = () => {
    if (resetting) return
    setOpenReset(false)
    setResetUser(null)
    setResetPass('')
    setResetError(null)
  }

  const submitReset = async () => {
    if (!resetUser) return
    setResetError(null)

    if (!resetPass || resetPass.length < 6) return setResetError('Hasło musi mieć min. 6 znaków')

    setResetting(true)
    const resp = await adminResetUserPassword({
      mail: resetUser.mail,
      imie: resetUser.imie,
      nowe_haslo: resetPass,
    })
    setResetting(false)

    if (!resp.success) {
      setResetError(resp.message || 'Nie udało się zresetować hasła')
      return
    }

    closeReset()
    alert(`Hasło zaktualizowane dla: ${resetUser.mail}`)
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <AppButton variant="back" onClick={() => navigate(-1)}>
          ← Wróć
        </AppButton>
        <h1>Użytkownicy</h1>
        <div className="a-actions">
          <input
            className="a-search"
            placeholder="Szukaj po imieniu, e-mailu, telefonie…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="a-select" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="wszyscy">Wszystkie role</option>
            <option value="admin">Administrator</option>
            <option value="kierownik">Kierownik</option>
            <option value="mechanik">Mechanik</option>
            <option value="recepcja">Recepcja</option>
            <option value="klient">Klient</option>
          </select>
          <select className="a-select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="wszyscy">Wszystkie statusy</option>
            <option value="aktywny">Aktywny</option>
            <option value="zablokowany">Zablokowany</option>
          </select>
          <button className="a-btn-primary" onClick={() => setOpenAdd(true)}>
            ➕ Dodaj użytkownika
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: 12 }}>⏳ Ładowanie…</div>}
      {error && <div style={{ padding: 12, color: '#ffb3b3' }}>⚠️ {error}</div>}

      {!loading && !error && (
        <div className="users-grid">
          {filtered.map((u) => {
            const r = toRole(u.rola)
            const s = toStatus((u as any).status)
            const last = (u as any).last_login_at || (u as any).lastLogin
            return (
              <div key={u.id} className="user-card">
                <div className="u-top">
                  <div className="u-name">{displayName(u)}</div>
                  <div className={`u-status ${s === 'aktywny' ? 'ok' : 'blocked'}`}>{s}</div>
                </div>

                <div className="u-meta">
                  <b>Rola:</b> <span className={`role-badge role-${r}`}>{ROLE_LABEL[r]}</span>
                </div>
                <div className="u-meta">
                  <b>E-mail:</b> {u.mail}
                </div>
                {u.telefon && (
                  <div className="u-meta">
                    <b>Telefon:</b> {u.telefon}
                  </div>
                )}
                {last && (
                  <div className="u-meta">
                    <b>Ostatnie logowanie:</b> {new Date(last).toLocaleString('pl-PL')}
                  </div>
                )}

                <div className="u-actions">
                  <button className="btn-secondary" onClick={() => openResetModal(u)}>
                    Reset hasła
                  </button>
                  <button className="btn-secondary" onClick={() => openRoleChangeModal(u)}>
                    Zmień rolę
                  </button>
                  <button className={s === 'aktywny' ? 'btn-danger' : 'btn-success'} onClick={() => toggleStatus(u)}>
                    {s === 'aktywny' ? 'Zablokuj' : 'Aktywuj'}
                  </button>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ padding: 12, color: '#ddd' }}>Brak użytkowników w tym widoku.</div>
          )}
        </div>
      )}

      {openAdd && (
        <div
          className="a-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAdd()
          }}
        >
          <div className="a-modal">
            <div className="a-modal-top">
              <h2 className="a-modal-title">Dodaj użytkownika</h2>
              <button className="btn-secondary" onClick={closeAdd} disabled={adding}>
                Zamknij
              </button>
            </div>

            <div className="a-modal-grid">
              <div className="a-field">
                <label>Imię</label>
                <input value={aImie} onChange={(e) => setAImie(e.target.value)} disabled={adding} />
              </div>

              <div className="a-field">
                <label>Nazwisko</label>
                <input value={aNazwisko} onChange={(e) => setANazwisko(e.target.value)} disabled={adding} />
              </div>

              <div className="a-field" style={{ gridColumn: '1 / -1' }}>
                <label>Email</label>
                <input value={aMail} onChange={(e) => setAMail(e.target.value)} disabled={adding} />
              </div>

              <div className="a-field">
                <label>Telefon (opcjonalnie)</label>
                <input value={aTelefon} onChange={(e) => setATelefon(e.target.value)} disabled={adding} />
              </div>

              <div className="a-field">
                <label>Rola</label>
                <select value={aRola} onChange={(e) => setARola(e.target.value as UserRole)} disabled={adding}>
                  <option value="klient">Klient</option>
                  <option value="recepcja">Recepcja</option>
                  <option value="mechanik">Mechanik</option>
                  <option value="kierownik">Kierownik</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="a-field" style={{ gridColumn: '1 / -1' }}>
                <label>Hasło</label>
                <input type="password" value={aHaslo} onChange={(e) => setAHaslo(e.target.value)} disabled={adding} />
              </div>
            </div>

            {addError && <div className="a-modal-msg error">⚠️ {addError}</div>}

            <div className="a-modal-actions">
              <button className="btn-secondary" onClick={closeAdd} disabled={adding}>
                Anuluj
              </button>
              <button className="a-btn-primary" onClick={submitAdd} disabled={adding}>
                {adding ? 'Dodawanie…' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {openReset && resetUser && (
        <div
          className="a-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReset()
          }}
        >
          <div className="a-modal">
            <div className="a-modal-top">
              <h2 className="a-modal-title">Reset hasła</h2>
              <button className="btn-secondary" onClick={closeReset} disabled={resetting}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 10, color: '#ddd' }}>
              <div style={{ fontWeight: 900, color: '#ffcc99' }}>{displayName(resetUser)}</div>
              <div style={{ marginTop: 6 }}>
                <b>Email:</b> {resetUser.mail}
              </div>
            </div>

            <div className="a-modal-grid" style={{ marginTop: 12 }}>
              <div className="a-field" style={{ gridColumn: '1 / -1' }}>
                <label>Nowe hasło</label>
                <input
                  type="password"
                  value={resetPass}
                  onChange={(e) => setResetPass(e.target.value)}
                  disabled={resetting}
                  placeholder="min. 6 znaków"
                />
              </div>
            </div>

            {resetError && <div className="a-modal-msg error">⚠️ {resetError}</div>}

            <div className="a-modal-actions">
              <button className="btn-secondary" onClick={closeReset} disabled={resetting}>
                Anuluj
              </button>
              <button className="a-btn-primary" onClick={submitReset} disabled={resetting}>
                {resetting ? 'Resetuję…' : 'Zapisz hasło'}
              </button>
            </div>
          </div>
        </div>
      )}

      {openRoleChange && roleChangeUser && (
        <div
          className="a-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRoleChange()
          }}
        >
          <div className="a-modal">
            <div className="a-modal-top">
              <h2 className="a-modal-title">Zmień rolę użytkownika</h2>
              <button className="btn-secondary" onClick={closeRoleChange} disabled={changingRole}>
                Zamknij
              </button>
            </div>

            <div style={{ marginTop: 10, color: '#ddd' }}>
              <div style={{ fontWeight: 900, color: '#ffcc99' }}>{displayName(roleChangeUser)}</div>
              <div style={{ marginTop: 6 }}>
                <b>Email:</b> {roleChangeUser.mail}
              </div>
              <div style={{ marginTop: 6 }}>
                <b>Obecna rola:</b> <span className={`role-badge role-${toRole(roleChangeUser.rola)}`}>{ROLE_LABEL[toRole(roleChangeUser.rola)]}</span>
              </div>
            </div>

            <div className="a-modal-grid" style={{ marginTop: 12 }}>
              <div className="a-field" style={{ gridColumn: '1 / -1' }}>
                <label>Nowa rola</label>
                <select value={selectedNewRole} onChange={(e) => setSelectedNewRole(e.target.value as UserRole)} disabled={changingRole}>
                  <option value="klient">Klient</option>
                  <option value="recepcja">Recepcja</option>
                  <option value="mechanik">Mechanik</option>
                  <option value="kierownik">Kierownik</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {roleChangeError && <div className="a-modal-msg error">⚠️ {roleChangeError}</div>}

            <div className="a-modal-actions">
              <button className="btn-secondary" onClick={closeRoleChange} disabled={changingRole}>
                Anuluj
              </button>
              <button className="a-btn-primary" onClick={submitRoleChange} disabled={changingRole}>
                {changingRole ? 'Zmieniam…' : 'Zmień rolę'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

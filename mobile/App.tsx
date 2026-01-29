import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './src/screens/Auth/LoginScreen'
import RegisterScreen from './src/screens/Auth/RegisterScreen'
import HomeScreen from './src/screens/Dashboard/HomeScreen'
import ClientDashboard from './src/screens/ClientDashboard/ClientDashboard'
import PlaceholderScreen from './src/screens/PlaceholderScreen'
import UserProfileScreen from './src/screens/Profile/UserProfileScreen'
import Zlecenia from './src/screens/Zlecenia/Zlecenia'
import Pojazdy from './src/screens/Pojazdy/Pojazdy'
import Klienci from './src/screens/Klienci/Klienci'
import Kalendarz from './src/screens/Kalendarz/Kalendarz'
import Search from './src/screens/Search/Search'
import Settings from './src/screens/Settings/Settings'
import AdminUsers from './src/screens/AdminUsers/AdminUsers'
import Magazyn from './src/screens/Magazyn/Magazyn'
import Faktury from './src/screens/Faktury/Faktury'
import AiHelper from './src/screens/AiHelper/AiHelper'
import Messages from './src/screens/Messages/Messages'
import VehicleInteractive from './src/screens/Interaktywne/VehicleInteractive'
import { getToken } from './src/utils/api'

type JwtPayload = {
  id?: number
  mail?: string
  rola?: string
  exp?: number
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

function getRoleFromToken(): string | null {
  const token = getToken()
  if (!token) return null
  const decoded = decodeJwt(token)
  return decoded?.rola ?? null
}

function HomeGate() {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />

  const role = getRoleFromToken()
  if (role === 'user') return <ClientDashboard />
  return <HomeScreen />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Start: jeśli jest token -> dashboard wg roli, jeśli nie -> login */}
        <Route path="/" element={<HomeGate />} />

        {/* Auth */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/reset-password" element={<RegisterScreen />} />

        {/* Dashboardy */}
        <Route path="/home" element={<HomeGate />} />
        <Route path="/client" element={<ClientDashboard />} />

        {/* Twoje ekrany */}
        <Route path="/UserProfileScreen" element={<UserProfileScreen />} />
        <Route path="/zlecenia" element={<Zlecenia />} />
        <Route path="/pojazdy" element={<Pojazdy />} />
        <Route path="/klienci" element={<Klienci />} />
        <Route path="/kalendarz" element={<Kalendarz />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/uzytkownicy" element={<AdminUsers />} />
        <Route path="/magazyn" element={<Magazyn />} />
        <Route path="/faktury" element={<Faktury />} />
        <Route path="/ai" element={<AiHelper />} />
        <Route path="/wiadomosci" element={<Messages />} />
        <Route path="/Interaktywne" element={<VehicleInteractive />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

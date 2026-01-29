import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './screens/Auth/LoginScreen'
import HomeScreen from './screens/Dashboard/HomeScreen'
import ErrorBoundary from './components/ErrorBoundary'
import PlaceholderScreen from './screens/PlaceholderScreen'
import UserProfileScreen from './screens/Profile/UserProfileScreen'
import Zlecenia from './screens/Zlecenia/Zlecenia'
import Pojazdy from './screens/Pojazdy/Pojazdy'
import Klienci from './screens/Klienci/Klienci'
import Kalendarz from './screens/Kalendarz/Kalendarz'
import Search from './screens/Search/Search'
import Settings from './screens/Settings/Settings'
import AdminUsers from './screens/AdminUsers/AdminUsers'
import Magazyn from './screens/Magazyn/Magazyn'
import Faktury from './screens/Faktury/Faktury'
import AiHelper from './screens/AiHelper/AiHelper'
import Messages from './screens/Messages/Messages'
import RegisterScreen from './screens/Auth/RegisterScreen'
import ResetPasswordScreen from './screens/Auth/ResetPasswordScreen'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ThemeProvider } from './screens/ThemeContext/ThemeContext'


if (typeof window !== 'undefined') {
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    const message = String(args[0] || '')
    if (
      message.includes('X4122') ||
      message.includes('X4008') ||
      message.includes('floating point') ||
      message.includes('precision') ||
      message.includes('WebGL')
    ) {
      return
    }
    originalWarn(...args)
  }
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          
          {}
          <Route path="/home" element={<ProtectedRoute><ErrorBoundary><HomeScreen /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/profile" element={<PlaceholderScreen />} />
          <Route path="/edit-profile" element={<PlaceholderScreen />} />
          <Route path="/list" element={<PlaceholderScreen />} />
          <Route path="/detail" element={<PlaceholderScreen />} />
          <Route path="/item-detail/:id" element={<PlaceholderScreen />} />
          <Route path="/notifications" element={<PlaceholderScreen />} />
          <Route path="/form" element={<PlaceholderScreen />} />
          <Route path="/payment" element={<PlaceholderScreen />} />
          <Route path="/transaction-details" element={<PlaceholderScreen />} />
          <Route path="/success" element={<PlaceholderScreen />} />
          <Route path="/order-history" element={<PlaceholderScreen />} />
          <Route path="/help-support" element={<PlaceholderScreen />} />
          <Route path="/admin" element={<PlaceholderScreen />} />
          <Route path="/location" element={<PlaceholderScreen />} />
          <Route path="/assigned-orders" element={<PlaceholderScreen />} />
          <Route path="/raport" element={<PlaceholderScreen />} />
          <Route path="/add-raport" element={<PlaceholderScreen />} />
        <Route path="/user-rapports" element={<PlaceholderScreen />} />
        <Route path="/UserProfileScreen" element={<ProtectedRoute><UserProfileScreen /></ProtectedRoute>} />
        
        {}
        <Route path="/zlecenia" element={<ProtectedRoute requiredPermission="canViewOrders"><Zlecenia /></ProtectedRoute>} />
        
        {}
        <Route path="/pojazdy" element={<ProtectedRoute requiredPermission="canViewVehicles"><Pojazdy /></ProtectedRoute>} />
        
        {}
        <Route path="/klienci" element={<ProtectedRoute requiredPermission="canViewCustomers"><Klienci /></ProtectedRoute>} />
        
        {}
        <Route path="/kalendarz" element={<ProtectedRoute requiredPermission="canViewAppointments"><Kalendarz /></ProtectedRoute>} />
        
        {}
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        
        {}
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {}
        <Route path="/admin/uzytkownicy" element={<ProtectedRoute requiredPermission="canManageUsers"><AdminUsers /></ProtectedRoute>} />
        
        {}
        <Route path="/magazyn" element={<ProtectedRoute requiredPermission="canViewWarehouse"><Magazyn /></ProtectedRoute>} />
        
        {}
        <Route path="/faktury" element={<ProtectedRoute requiredPermission="canViewInvoices"><Faktury /></ProtectedRoute>} />
        
        {}
        <Route path="/ai" element={<ProtectedRoute requiredPermission="canViewAiHelper"><AiHelper /></ProtectedRoute>} />
        
        {}
        <Route path="/wiadomosci" element={<ProtectedRoute requiredPermission="canViewMessages"><Messages /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

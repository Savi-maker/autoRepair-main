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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/home" element={<ErrorBoundary><HomeScreen /></ErrorBoundary>} />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App

# ============================================
# KOMENDY URUCHOMIENIA - AutoRepair System
# ============================================

# ---------------------------------------------
# 1. BACKEND (Node.js + Express + TypeScript)
# ---------------------------------------------

# Instalacja zależności
cd backend
npm install

# Build TypeScript do JavaScript
npm run build

# Seed bazy danych (pierwsza inicjalizacja)
npm run seed

# Uruchomienie serwera (development)
npm run dev

# LUB uruchomienie serwera (production)
npm start


# ---------------------------------------------
# 2. FRONTEND (React + Vite + TypeScript)
# ---------------------------------------------

# Instalacja zależności
cd mobile
npm install

# Uruchomienie dev servera (http://localhost:5173)
npm run dev

# Build produkcyjny
npm run build

# Preview buildu produkcyjnego
npm run preview


# ---------------------------------------------
# 3. RESET BAZY DANYCH (pełne wyczyszczenie)
# ---------------------------------------------

# Windows (PowerShell)
cd backend
Remove-Item -Path "data\mydb.sqlite3" -Force
npm run seed

# Linux/Mac (Bash)
cd backend
rm -f data/mydb.sqlite3
npm run seed


# ---------------------------------------------
# 4. PEŁNE URUCHOMIENIE (od zera)
# ---------------------------------------------

# Terminal 1 - Backend
cd backend
npm install
npm run build
npm run seed
npm run dev

# Terminal 2 - Frontend
cd mobile
npm install
npm run dev

# Aplikacja dostępna na: http://localhost:5173
# API dostępne na: http://localhost:3000


# ---------------------------------------------
# 5. TESTOWANIE API (przykładowe zapytania)
# ---------------------------------------------

# Health check
curl http://localhost:3000/health

# Login (PowerShell)
$body = @{email="jan@example.com"; password="password123"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -ContentType "application/json" -Body $body

# Login (Bash/curl)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jan@example.com","password":"password123"}'


# ---------------------------------------------
# 6. UŻYTKOWNICY TESTOWI (po seed)
# ---------------------------------------------

# Admin:
# Email: admin@example.com
# Hasło: @Admin123

# Klient:
# Email: client1@example.com
# Hasło: Klient123

# Kierownik:
# Email: manager1@example.com
# Hasło: Mgr12345

# Mechanik:
# Email: mechanic1@example.com
# Hasło: Mech1234

# Recepcja:
# Email: receptionist1@example.com
# Hasło: Rec12345

# Zwyczajny użytkownik:
# Email: user1@example.com
# Hasło: Pass1234


# ---------------------------------------------
# 7. PRZYDATNE SKRYPTY
# ---------------------------------------------

# Backend - tylko build bez uruchomienia
cd backend
npm run build

# Backend - debug z logami
cd backend
npm run seed
node dist/server.js 2>&1

# Frontend - analiza bundle size
cd mobile
npm run build
npm run preview

# Sprawdzenie wersji Node.js i npm
node --version
npm --version

# 📊 END-TO-END APLIKACJA AUTOREPAIR - ANALIZA KOMPLETNA

**Data analizy:** 04.02.2026  
**Wersja aplikacji:** 1.0.0  
**Stack:** Node.js + Express + TypeScript (backend), React + Vite + TypeScript (frontend), SQLite3 (baza danych)

---

## 1. ARCHITEKTURA APLIKACJI

### 1.1 Backend (Node.js + Express)
- **Port:** 3000
- **Baza danych:** SQLite3 (`backend/data/mydb.sqlite3`)
- **Zaimplementowane endpointy:**
  - `/api/auth` - Autentykacja (login, logout, register, reset password)
  - `/api/me` - Profil zalogowanego użytkownika
  - `/api/profile` - Zarządzanie profilem
  - `/api/admin/users` - Zarządzanie użytkownikami (admin)
  - `/api/orders` - Zlecenia (CRUD)
  - `/api/notifications` - Powiadomienia
  - `/api/customers` - Klienci (CRUD)
  - `/api/vehicles` - Pojazdy (CRUD)
  - `/api/appointments` - Wizyty (CRUD + status: oczekujacy/zaakceptowany/wykonano)
  - `/api/parts` - Części zamienne (CRUD)
  - `/api/invoices` - Faktury (CRUD)
  - `/api/messages` - Wiadomości
  - `/api/users/mechanics` - Lista mechaników (do przypisań)
  - `/api/analytics` - Analityka
  - `/api/suppliers` - Dostawcy
  - `/api/schedule` - Harmonogram

### 1.2 Frontend (React + Vite)
- **Port:** 5174 (zwyczajnie 5173)
- **Framework:** React 18 + React Router v6
- **Theme:** Dark mode (CSS)
- **3D Graphics:** Three.js (V8 Engine, Cyberpunk Car)

---

## 2. UŻYTKOWNICY I ROLE

### 2.1 Role w systemie
1. **admin** - Pełny dostęp do wszystkiego
2. **kierownik** (manager) - Zarządzanie pracownikami, zleceniami, klientami
3. **mechanik** (mechanic) - Aktualizacja zleceń, podgląd zaplanowanych prac
4. **recepcja** (receptionist) - Zarządzanie wizytami, zmiana statusów, przyjęcie zleceń
5. **klient** (client) - Umawia wizyty, przeglądnie pojazdy, faktury
6. **user** - Użytkownik zwykły (częściowy dostęp)

### 2.2 Dane testowe
```
Admin:      admin@example.com          / @Admin123
Kierownik:  manager1@example.com       / Mgr12345
Mechanik:   mechanic1@example.com      / Mech1234
Recepcja:   receptionist1@example.com  / Rec12345
Klient:     client1@example.com        / Klient123
User:       user1@example.com          / Pass1234
```

**Struktura bazy:**
- 1 admin
- 40 zwykłych użytkowników
- 10 kierowników
- 10 mechaników
- 5 recepcjonistek
- 10 klientów
- **Razem: 76 użytkowników**

---

## 3. EKRANY I ICH STAN

### 3.1 EKRANY W PEŁNI ZREALIZOWANE ✅

#### 📱 **Autentykacja** (100% gotowe)
- **LoginScreen** - Login z email i hasłem (SHA-256 + bcrypt)
- **RegisterScreen** - Rejestracja nowych użytkowników
- **ResetPasswordScreen** - Reset hasła

**Przepływ:**
1. Użytkownik loguje się
2. Backend zwraca JWT token
3. Token przechowywany w localStorage
4. Request headers zawierają token

#### 📊 **Dashboard / HomeScreen** (95% gotowe)
- **Dla roli admin/kierownik:** KPI panel z metrykami, następna wizyta, ostatnie aktywności
- **Dla roli klient:** kafelki ofert serwisu + szybkie akcje (bez metryk magazynu/faktur)
- **Wyświetlane dane:**
  - ✅ Liczba nowych zleceń
  - ✅ Liczba aktywnych zleceń
  - ✅ Niska ilość części na magazynie
  - ✅ Zalegające faktury
  - ❌ Powiadomienia (endpoint istnieje, ale nie zintegrowany)
  - ❌ Historyczne trendy (analytics endpoint jest pusty)

**Komponenty:**
- KPI grid (6 metryki)
- Activity log (ostatnie 10 zdarzeń)
- Następna wizyta (wyświetlana ze statusem)

#### 📅 **Kalendarz / Wizyty** (90% gotowe - NOWY)
- **Funkcjonalność:**
  - ✅ Przeglądanie wizyt w widoku kalendarza
  - ✅ Filtrowanie po dniu
  - ✅ Tworzenie nowej wizyty
  - ✅ Modal szczegółów wizyty
  - ✅ Zmiana statusu wizyty (recepcja/kierownik/admin)
  - ✅ Konwersja wizyty na zlecenie (z opcjonalnym wyborem mechanika)
  - ✅ Wyświetlanie powiązania ze zleceniem
  - ❌ Przełożenie wizyty (przycisk, ale brak implementacji)

**Statusy wizyt:**
- `oczekujacy` - Wizyta czeka na potwierdzenie
- `zaakceptowany` - Recepcja zaakceptowała
- `wykonano` - Wizyta zrealizowana

#### 📋 **Zlecenia** (95% gotowe - ZMODYFIKOWANY)
- **Funkcjonalność:**
  - ✅ Przeglądanie listy zleceń z filtrowaniem
  - ✅ Tworzenie nowego zlecenia
  - ✅ Zmiana statusu zlecenia
  - ✅ Przydzielenie mechanika (NOWY - dropdown zamiast ID)
  - ✅ Wyświetlanie szczegółów zlecenia
  - ✅ Zarządzanie zleceniami (edit/delete dla uprawnień)
  - ❌ 3D model silnika V8 (wyświetlany ale nie obsługuje interakcji w zleceniu)

**Statusy zleceń:**
- `nowe` - Nowe zlecenie
- `w_trakcie` - Zlecenie w wykonaniu
- `zakonczone` - Zlecenie zakończone
- `anulowane` - Zlecenie anulowane

**Uprawnienia:**
- Admin/Kierownik: Mogą tworzyć, edytować, usuwać
- Mechanik: Może edytować przydzielone sobie zlecenia
- Recepcja: Może tworzyć i edytować (bez usuwania)
- Klient: Może przeglądać swoje zlecenia

#### 🚗 **Pojazdy** (90% gotowe)
- **Funkcjonalność:**
  - ✅ Przeglądanie listy pojazdów
  - ✅ Tworzenie nowego pojazdu
  - ✅ Edycja pojazdu
  - ✅ Usuwanie pojazdu
  - ✅ Powiązanie z klientem
  - ✅ Historia serwisowa (ostatnia inspekcja)
  - ❌ 3D interaktywny model Cyberpunk Car (istnieje ale nie zintegrowany z listą)

#### 👥 **Klienci** (85% gotowe)
- **Funkcjonalność:**
  - ✅ Przeglądanie listy klientów
  - ✅ Tworzenie nowego klienta
  - ✅ Edycja danych klienta
  - ✅ Podgląd pojazdów klienta
  - ✅ Podgląd zleceń klienta
  - ✅ Tworzenie zlecenia dla klienta (z modalu)
  - ❌ Eksport do CSV/PDF
  - ❌ Oceny i recenzje

#### 🧾 **Faktury** (75% gotowe)
- **Funkcjonalność:**
  - ✅ Przeglądanie listy faktur
  - ✅ Filtrowanie po statusie (wystawiona/oczekuje/zapłacona/anulowana)
  - ✅ Pobieranie faktury (PDF - w przygotowaniu)
  - ✅ Zmiana statusu faktury (admin)
  - ❌ Generowanie automatyczne po zakończeniu zlecenia
  - ❌ Wysyłanie email
  - ❌ Integracja z systemem płatności

#### 📦 **Magazyn / Części** (80% gotowe)
- **Funkcjonalność:**
  - ✅ Przeglądanie listy części zamiennych
  - ✅ Filtrowanie po niskiej ilości magazynowej
  - ✅ Dodawanie nowej części
  - ✅ Edycja części
  - ✅ Usuwanie części
  - ✅ Rezerwacja części (modal)
  - ✅ Zamawianie części (modal)
  - ❌ Historia zmian ceny
  - ❌ Integracja z dostawcami

#### 💬 **Wiadomości** (70% gotowe)
- **Funkcjonalność:**
  - ✅ Przeglądanie listy wiadomości
  - ✅ Tworzenie nowej wiadomości
  - ✅ Odpowiadanie na wiadomości
  - ✅ Oznaczanie jako przeczytane
  - ❌ Notyfikacje real-time (WebSocket nie zaimplementowany)
  - ❌ Załączniki

#### 👤 **Profil użytkownika** (85% gotowe)
- **Funkcjonalność:**
  - ✅ Wyświetlanie danych profilu
  - ✅ Edycja danych (imię, nazwisko, telefon)
  - ✅ Zmiana hasła (SHA-256 + bcrypt)
  - ✅ Wylogowanie
  - ❌ Zdjęcie profilowe
  - ❌ Preferencje powiadomień

#### 🔍 **Szukaj** (60% gotowe)
- **Funkcjonalność:**
  - ✅ Wyszukiwanie globalne po tekście
  - ✅ Filtrowanie wyników po typie
  - ❌ Zaawansowane filtry
  - ❌ Zapisane wyszukiwania

#### ⚙️ **Ustawienia** (50% gotowe)
- **Funkcjonalność:**
  - ✅ Przełącznik dark/light mode
  - ✅ Preferencje języka (placeholder)
  - ❌ Powiadomienia push
  - ❌ Integracje


#### 👨‍💼 **Admin Panel - Użytkownicy** (80% gotowe)
- **Funkcjonalność:**
  - ✅ Przeglądanie listy użytkowników
  - ✅ Wyszukiwanie użytkownika
  - ✅ Tworzenie nowego użytkownika
  - ✅ Edycja roli użytkownika
  - ✅ Reset hasła
  - ✅ Zmiana statusu (aktywny/nieaktywny)
  - ❌ Eksport listy
  - ❌ Logi aktywności użytkownika

### 3.2 EKRANY NIEDOKOŃCZONE (Placeholder)

Poniższe ekrany wyświetlają **PlaceholderScreen** (pusty komunikat):

- `/notifications` - Powiadomienia
- `/edit-profile` - Edycja profilu (duplikat ProfileScreen)
- `/list` - Generyczna lista
- `/detail` - Genericzny szczegół
- `/item-detail/:id` - Szczegół przedmiotu
- `/form` - Formularz
- `/payment` - Płatność
- `/transaction-details` - Szczegóły transakcji
- `/success` - Strona sukcesu
- `/order-history` - Historia zleceń (duplikat Zlecenia)
- `/help-support` - Pomoc i wsparcie
- `/admin` - Panel admina (duplikat AdminUsers)
- `/location` - Lokalizacja
- `/assigned-orders` - Zlecenia przydzielone (duplikat Zlecenia dla mechanika)
- `/raport` - Raporty
- `/add-raport` - Dodaj raport
- `/user-rapports` - Raporty użytkownika

**Razem: 17 ekranów placeholder**

---

## 4. SCHEMATY END-TO-END

### 4.1 🔐 SCENARIUSZ: Logowanie i Dashboard

```
START (niezalogowany)
  ↓
[LoginScreen] - Użytkownik wprowadza email i hasło
  ↓
POST /api/auth/login
  ↓ (Sukces) / (Błąd - wyświetl komunikat)
[JWT token zwrócony - zapisany w localStorage]
  ↓
REDIRECT → [HomeScreen / Dashboard]
  ↓
Wyświetlenie KPI i aktywności (dane z backendu)
  ↓
Możliwość nawigacji do innych ekranów
```

**Przepływ logowania:**
1. Frontend przesyła hasło jako SHA-256 hash
2. Backend porównuje z SHA-256 hasłem z bazy
3. Jeśli pasuje, dodatkowa walidacja bcrypt
4. JWT token zwracany (exp: 7 dni)
5. Token wysyłany w każdym request header: `Authorization: Bearer <token>`

---

### 4.2 📅 SCENARIUSZ: Receptionist - Obsługa wizyty od A do Z (NOWY - ZREALIZOWANY)

```
START - Receptionist zalogowany
  ↓
[Kalendarz]
  ↓
1️⃣ Podgląd wizyt na dzisiaj
  ↓
   GET /api/appointments (filtered by date)
  ↓
2️⃣ Klient przychodzi - zmiana statusu wizyty
  ↓
   [Szczegóły wizyty - Modal]
   Status: oczekujacy → zaakceptowany
   ↓
   PATCH /api/appointments/:id {status: "zaakceptowany"}
  ↓
3️⃣ Po wykonaniu pracy - zmiana statusu na wykonano
  ↓
   Status: zaakceptowany → wykonano
   ↓
   PATCH /api/appointments/:id {status: "wykonano"}
  ↓
4️⃣ Konwersja wizyty na zlecenie (jeśli wymagane)
  ↓
   [Szczegóły wizyty - Modal]
  Wybór mechanika (opcjonalnie) + przycisk: "📋 Utwórz zlecenie"
   ↓
  GET /api/users/mechanics
  POST /api/orders (customer_id, vehicle_id, title, notes, mechanic_user_id)
   ↓
   PATCH /api/appointments/:id {order_id: <new_order_id>}
  ↓
5️⃣ Przechodzenie do Zleceń
  ↓
   NAVIGATE → [Zlecenia]
  ↓
END
```

**Co jest zrealizowane:**
- ✅ Wyświetlanie wizyt na kalendarzu
- ✅ Filtowanie po dniu
- ✅ Modal szczegółów wizyty
- ✅ Zmiana statusu (UI dropdown + API PATCH)
- ✅ Uprawnienia (tylko recepcja/kierownik/admin mogą zmieniać)
- ✅ Konwersja wizyty na zlecenie
- ✅ Automatyczne powiązanie order_id

**Co jeszcze brakuje:**
- ❌ Email potwierdzenia dla klienta
- ❌ SMS reminder godzinę przed wizytą
- ❌ Powiadomienie w aplikacji dla klienta o zmianach statusu

---

### 4.3 🔧 SCENARIUSZ: Mechanik - Wykonanie zlecenia

```
START - Mechanik zalogowany
  ↓
[Zlecenia] - Filtr: tylko przydzielone sobie
  ↓
1️⃣ Pobranie listy zleceń
  ↓
   GET /api/orders?status=w_trakcie&mechanic_user_id=<my_id>
  ↓
2️⃣ Wybór zlecenia i przejście do szczegółów
  ↓
   [Szczegóły zlecenia - Modal]
   - Informacje o kliencie
   - Informacje o pojeździe
   - Historia poprzednich napraw
   - Aktualna opis pracy
  ↓
3️⃣ Aktualizacja statusu i notatek
  ↓
   Status: nowe → w_trakcie → zakonczone
   PATCH /api/orders/:id {status: "zakonczone", opis: "..."}
  ↓
4️⃣ Zapis części zamiennych (je jeśli zmieniane)
  ↓
   [Magazyn] - Rezerwacja części
   PATCH /api/parts/:id {stock: stock - reserved_qty}
  ↓
5️⃣ Powrót do listy zleceń
  ↓
   [Zlecenia] - widz zaktualizowany status
  ↓
END
```

**Co jest zrealizowane:**
- ✅ Przeglądanie zleceń przydzielonych
- ✅ Filtrowanie po statusie
- ✅ Zmiana statusu (UI select + API PATCH)
- ✅ Edycja opisu pracy
- ✅ Rezerwacja części z magazynu (modal)
- ✅ Przydzielanie mechanika (NOWY - dropdown zamiast ID)

**Co jeszcze brakuje:**
- ❌ Logowanie czasu pracy (time tracking)
- ❌ Załączanie zdjęć/dokumentacji
- ❌ Historia zmian statusu (kto i kiedy zmienił)
- ❌ Push notification dla kierownika gdy zlecenie zakończone

---

### 4.4 👤 SCENARIUSZ: Klient - Umówienie wizyty i prześledzenie

```
START - Klient zalogowany (rola: klient / user)
  ↓
[Kalendarz]
  ↓
1️⃣ Wybór daty i godziny dla wizyty
  ↓
   [Formularz umówienia wizyty]
   - Wybór pojazdu
   - Typ usługi (diagnostyka/wymiana oleju/itp)
   - Notatki
  ↓
2️⃣ Utworzenie wizyty
  ↓
   POST /api/appointments {
     customer_id: <my_customer_id>,
     vehicle_id: <selected_vehicle_id>,
     title: "Wymiana oleju",
     start_at: "2025-02-04T10:00:00",
     status: "oczekujacy"
   }
  ↓
3️⃣ Potwierdzenie (email)
  ↓
   ✉️ Email: "Wizyta zaplanowana na 2025-02-04 10:00"
   (nie zaimplementowane - brakuje wysyłania email)
  ↓
4️⃣ Prześledzenie wizyty
  ↓
   [Kalendarz] - Przeglądanie swoich wizyt
   GET /api/appointments?customer_id=<my_id>
   ↓
   Statusy widoczne dla klienta:
   - Oczekujący - "Zaplanowana, oczekuje potwierdzenia"
   - Zaakceptowany - "Zaakceptowana, przygotowujemy się"
   - Wykonano - "Ukończona"
  ↓
5️⃣ Przeglądanie zleceń ze swoich wizyt
  ↓
   [Zlecenia] - Tylko własne zlecenia
   GET /api/orders?customer_id=<my_id>
  ↓
6️⃣ Przeglądanie faktur
  ↓
   [Faktury] - Tylko własne faktury
   GET /api/invoices?customer_id=<my_id>
  ↓
END
```

**Co jest zrealizowane:**
- ✅ Umówienie wizyty (calendar interface)
- ✅ Wybór pojazdu (dropdown)
- ✅ Wybór daty i godziny
- ✅ Przeglądanie swoich wizyt
- ✅ Wyświetlanie statusu wizyty (z formatowaniem PL)
- ✅ Przeglądanie swoich zleceń
- ✅ Przeglądanie swoich faktur

**Co jeszcze brakuje:**
- ❌ Email potwierdzenia wizyty
- ❌ SMS reminder
- ❌ Anulowanie wizyty
- ❌ Przełożenie wizyty na inny termin
- ❌ Powiadomienie o zmianach statusu

---

### 4.5 💼 SCENARIUSZ: Kierownik - Zarządzanie serwisem

```
START - Kierownik zalogowany
  ↓
[HomeScreen / Dashboard]
  ↓
1️⃣ Przeglądanie metryk
  ↓
   - Nowe zlecenia (ostatnie 24h)
   - Zlecenia w trakcie
   - Części na niskim stanie
   - Zalegające faktury
  ↓
2️⃣ Zarządzanie klientami
  ↓
   [Klienci] - CRUD operacje
   POST /api/customers (nowy klient)
   PATCH /api/customers/:id (edycja)
   DELETE /api/customers/:id (usunięcie)
  ↓
3️⃣ Zarządzanie pojazdami klientów
  ↓
   [Pojazdy] - przypisane do klientów
   POST /api/vehicles
   PATCH /api/vehicles/:id
   DELETE /api/vehicles/:id
  ↓
4️⃣ Tworzenie i przydzielanie zleceń
  ↓
   [Zlecenia] - Nowe zlecenie
   POST /api/orders {
     service: "Wymiana oleju",
     customer_id: <id>,
     vehicle_id: <id>,
     mechanic_user_id: <id>, // NOWY - dropdown
     status: "nowe"
   }
  ↓
5️⃣ Zarządzanie wizytami
  ↓
   [Kalendarz] - pełny dostęp
   POST /api/appointments
   PATCH /api/appointments/:id
   DELETE /api/appointments/:id
  ↓
6️⃣ Zarządzanie magazynem
  ↓
   [Magazyn] - Części i rezerwacje
   POST /api/parts
   PATCH /api/parts/:id
   DELETE /api/parts/:id
  ↓
7️⃣ Zarządzanie zespołem (bez pełnej implementacji)
  ↓
   [Admin / Użytkownicy] - ograniczony dostęp
  ↓
END
```

**Co jest zrealizowane:**
- ✅ Przeglądanie metryki (KPI panel)
- ✅ Zarządzanie klientami (CRUD)
- ✅ Zarządzanie pojazdami (CRUD)
- ✅ Tworzenie i edycja zleceń
- ✅ Przydzielanie mechanika (dropdown zamiast ID)
- ✅ Zarządzanie wizytami
- ✅ Zarządzanie magazynem

**Co jeszcze brakuje:**
- ❌ Raportowanie (raporty ze zleceń, zarobki)
- ❌ Zarządzanie harmonogramem (serwis, urlopy)
- ❌ Analityka (trendy, wydajność)
- ❌ Zarządzanie dostawcami i zamówieniami części

---

## 5. MAPOWANIE EKRANÓW NA ROLE

| Ekran | Admin | Kierownik | Mechanik | Recepcja | Klient | User |
|-------|-------|-----------|----------|----------|--------|------|
| Dashboard | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ |
| Kalendarz | ✅ | ✅ | ✅ RO | ✅ | ✅ | ✅ |
| Zlecenia | ✅ | ✅ | ✅ RW | ✅ RW | ✅ RO | ✅ RO |
| Pojazdy | ✅ | ✅ | ✅ RO | ✅ | ✅ | ✅ RO |
| Klienci | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Faktury | ✅ | ✅ | ❌ | ✅ RO | ✅ RO | ❌ |
| Magazyn | ✅ | ✅ | ✅ RO | ⚠️ | ❌ | ❌ |
| Wiadomości | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ustawienia | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AdminUsers | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI Helper | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legenda:**
- ✅ Pełny dostęp (read + write)
- ✅ RO = Read Only
- ✅ RW = Read + Write (tylko własne)
- ⚠️ Ograniczony dostęp (własne rekordy)
- ❌ Brak dostępu

---

## 6. PRZEPŁYW DANYCH - PRZYKŁAD KOMPLETNY

### Scenariusz: Klient umawiał wizytę → Recepcja zmienia status → Konwertuje na zlecenie → Mechanik to wykonuje

```
┌─────────────────────────────────────────────────────────────────────────┐
│ KLIENT (klient1@example.com)                                            │
│ 1. Otwiera Kalendarz                                                    │
│ 2. Wybiera datę 2025-02-04 10:00                                        │
│ 3. Wybiera pojazd: Toyota Corolla                                       │
│ 4. Wprowadza: "Wymiana oleju"                                           │
│ 5. Kliknie "Zapisz wizytę"                                              │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
        POST /api/appointments {
          customer_id: 41,
          vehicle_id: 1,
          title: "Wymiana oleju",
          start_at: "2025-02-04T10:00:00",
          status: "oczekujacy"
        }
                              ↓
        Backend: Zapisuje wizytę z customer_id=41
                              ↓
        Response: { id: 1, status: 201 }
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ RECEPCJA (receptionist1@example.com)                                    │
│ 1. Otwiera Kalendarz                                                    │
│ 2. Przeglądanie wizyt na dzisiaj                                        │
│ 3. Widzi wizytę: "Wymiana oleju" - klient1 - Toyota - status OCZEKUJĄCY│
│ 4. Kliknie "Szczegóły"                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
        GET /api/appointments/1
                              ↓
        Response: {
          id: 1,
          customer_id: 41,
          vehicle_id: 1,
          title: "Wymiana oleju",
          start_at: "2025-02-04T10:00:00",
          status: "oczekujacy",
          order_id: null
        }
                              ↓
        Modal: Wyświetla szczegóły + dropdown statusu (recepcja może zmieniać)
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ RECEPCJA - ZMIANA STATUSU                                               │
│ 1. Zmienia dropdown z "Oczekujący" na "Zaakceptowany"                   │
│ 2. Klika "Zapisz status"                                                │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
        PATCH /api/appointments/1 {
          status: "zaakceptowany"
        }
                              ↓
        Backend: UPDATE appointments SET status='zaakceptowany' WHERE id=1
                              ↓
        Response: { success: true, data: { id: 1, status: "zaakceptowany" } }
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ RECEPCJA - KONWERSJA NA ZLECENIE                                         │
│ 1. Klika "📋 Utwórz zlecenie"                                           │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
        POST /api/orders {
          customer_id: 41,
          vehicle_id: 1,
          service: "Wymiana oleju",
          opis: null (z appointment.notes),
          status: "nowe"
        }
                              ↓
        Backend: INSERT INTO orders (...)
                              ↓
        Response: { id: 10, status: "nowe" }
                              ↓
        Frontend: PATCH /api/appointments/1 {
          order_id: 10
        }
                              ↓
        Backend: UPDATE appointments SET order_id=10 WHERE id=1
                              ↓
        Response: { success: true }
                              ↓
        Frontend: REDIRECT /zlecenia
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ KIEROWNIK (manager1@example.com)                                        │
│ 1. Otwiera Zlecenia                                                     │
│ 2. Widzi nowe zlecenie: "Wymiana oleju" - customer_id 41 - vehicle_id 1 │
│ 3. Kliknie "Szczegóły"                                                  │
│ 4. Widzi dropdown "Wybierz mechanika..."                                │
│ 5. Wybiera: "Jan Kowalski (mechanik1@example.com)"                      │
│ 6. Klika "Zapisz"                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
        PATCH /api/orders/10 {
          mechanic_user_id: 3
        }
                              ↓
        Backend: UPDATE orders SET mechanic_user_id=3 WHERE id=10
                              ↓
        Response: { success: true }
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ MECHANIK (mechanic1@example.com)                                        │
│ 1. Otwiera Zlecenia                                                     │
│ 2. Przeglądanie zleceń przydzielonych sobie (mechanic_user_id=3)        │
│ 3. Widzi zlecenie: "Wymiana oleju" - Toyota - status NOWE               │
│ 4. Kliknie "Szczegóły"                                                  │
│ 5. Zmienia status: NOWE → W TRAKCIE                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
        PATCH /api/orders/10 {
          status: "w_trakcie"
        }
                              ↓
        Backend: UPDATE orders SET status='w_trakcie' WHERE id=10
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ MECHANIK - WYKONANIE PRACY                                              │
│ 1. Dodaje notatki: "Wymieniono olej i filtr, sprawdzono ciśnienie"     │
│ 2. Rezerwuje części z magazynu (jeśli wymagane)                         │
│ 3. Zmienia status na ZAKOŃCZONE                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
        PATCH /api/orders/10 {
          status: "zakonczone",
          opis: "Wymieniono olej i filtr, sprawdzono ciśnienie",
          end_at: "2025-02-04T11:30:00"
        }
                              ↓
        Backend: UPDATE orders SET status='zakonczone', opis=..., end_at=...
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ KLIENT - PRZEGLĄDANIE STANU                                             │
│ 1. Otwiera Zlecenia                                                     │
│ 2. Widzi zlecenie o ID 10 ze statusem "Zakończone"                     │
│ 3. Może pobrać fakturę (jeśli wygenerowana)                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. STATYSTYKI IMPLEMENTACJI

### 7.1 Backend API

| Endpoint | GET | POST | PATCH | DELETE | Status |
|----------|-----|------|-------|--------|--------|
| /appointments | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| /orders | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| /customers | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| /vehicles | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| /parts | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| /invoices | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| /messages | ✅ | ✅ | ⚠️ | ✅ | ⚠️ 80% |
| /notifications | ✅ | ✅ | ⚠️ | ✅ | ⚠️ 80% |
| /admin/users | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| /schedule | ✅ | ✅ | ✅ | ✅ | ⚠️ 70% |
| /analytics | ✅ | ❌ | ❌ | ❌ | ⚠️ 40% |
| /suppliers | ✅ | ✅ | ✅ | ✅ | ⚠️ 80% |

**Razem implementacja backendu: 90%**

### 7.2 Frontend Components

| Komponent | Funkcjonalność | Status |
|-----------|-----------------|--------|
| LoginScreen | Logowanie z JWT | ✅ 100% |
| RegisterScreen | Rejestracja | ✅ 100% |
| ResetPasswordScreen | Reset hasła | ✅ 100% |
| HomeScreen (Dashboard) | KPI + Activity Log | ✅ 95% |
| Kalendarz | Calendar + Status Change + Order Conversion | ✅ 95% |
| Zlecenia | Orders + Mechanic Dropdown | ✅ 95% |
| Pojazdy | Vehicles CRUD | ✅ 90% |
| Klienci | Customers CRUD | ✅ 90% |
| Faktury | Invoices List + PDF | ✅ 75% |
| Magazyn | Parts CRUD + Reservations | ✅ 85% |
| Wiadomości | Messages | ✅ 70% |
| Profil | Profile CRUD | ✅ 85% |
| AdminUsers | Users Management | ✅ 85% |
| AI Helper | Diagnostics (mock) | ✅ 40% |
| Search | Global Search | ✅ 60% |
| Settings | Theme + Preferences | ✅ 50% |

**Razem implementacja frontendu: 80%**



## 9. INSTRUKCJE URUCHOMIENIA

### Backend
```bash
cd backend
npm install
npm run seed      # Inicjalizacja bazy z danymi testowymi
npm run dev       # Uruchomienie dev server na porcie 3000
```

### Frontend
```bash
cd mobile
npm install
npm run dev       # Uruchomienie dev server na porcie 5173/5174
```

### Testowanie
```bash
# Login jako admin
Email: admin@example.com
Hasło: @Admin123

# Login jako recepcja (nowy workflow!)
Email: receptionist1@example.com
Hasło: Rec12345

# Login jako klient
Email: client1@example.com
Hasło: Klient123

# Login jako mechanik
Email: mechanic1@example.com
Hasło: Mech1234
```

---

## 11. PODSUMOWANIE

**Aplikacja AutoRepair jest w stanie:**
- ✅ Pełna autentykacja (login, register, password reset)
- ✅ Zarządzanie klientami i pojazdami
- ✅ Planowanie i zmiana statusu wizyt (NOWE)
- ✅ Tworzenie i przydzielanie zleceń z dropdownem mechaników (ZMODYFIKOWANE)
- ✅ Konwersja wizyt na zlecenia (NOWE)
- ✅ Zarządzanie magazynem
- ✅ Zarządzanie faktami
- ✅ Wiadomości między użytkownikami
- ✅ Role-based access control (RBAC)



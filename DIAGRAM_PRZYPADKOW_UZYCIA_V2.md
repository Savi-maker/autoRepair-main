# 📊 DIAGRAM PRZYPADKÓW UŻYCIA (Use Case Diagrams) - WERSJA 2

**Projekt**: AutoRepair - Platforma do zarządzania naprawami samochodów  
**Data**: Luty 2026  
**Ulepszona wersja**: Podzielona na 4 czytelne diagramy

---

---

## 🎯 PRZEGLĄD

Zamiast jednego dużego, nieczytelnego diagramu, poniżej znajdują się 5 osobnych diagramów:
- 📊 Diagram 0️⃣: **OGÓLNY** (Wszystkie UC i aktorzy)
- 📊 Diagram 1️⃣: **KLIENT** (24 UC)
- 📊 Diagram 2️⃣: **MECHANIK/SERWIS** (28 UC)
- 📊 Diagram 3️⃣: **ADMINISTRATOR** (16 UC)
- 📊 Diagram 4️⃣: **SYSTEM** (2 UC)

---

## 📊 DIAGRAM 0️⃣: OGÓLNY - WSZYSTKIE PRZYPADKI UŻYCIA

```mermaid
graph TD
    subgraph Actors["👥 AKTORZY"]
        Client["👤 KLIENT"]
        Mechanic["🔧 MECHANIK"]
        Admin["👨‍💼 ADMIN"]
        System["🖥️ SYSTEM"]
    end
    
    subgraph Categories["📋 KATEGORIE UC"]
        Auth["🔐 AUTENTYKACJA<br/>UC1-3"]
        Vehicle["🚗 POJAZDY<br/>UC5-8"]
        Order["🔧 ZLECENIA<br/>UC9-14"]
        Search["🔍 WYSZUKIWANIE<br/>UC15-18"]
        Booking["📅 REZERWACJA<br/>UC19-20"]
        Invoice["📄 FAKTURY<br/>UC23-26"]
        Message["💬 WIADOMOŚCI<br/>UC27-29"]
        Notif["🔔 POWIADOMIENIA<br/>UC30-32"]
        Parts["📦 MAGAZYN<br/>UC40-42"]
        AdminPanel["👥 ADMINISTRACJA<br/>UC36-39"]
        Analytics["📊 ANALITYKA<br/>UC33-35"]
        Profile["👤 PROFIL<br/>UC43-45"]
    end
    
    Client -->|Dostęp| Auth
    Client -->|Dostęp| Vehicle
    Client -->|Dostęp| Order
    Client -->|Dostęp| Search
    Client -->|Dostęp| Booking
    Client -->|Dostęp| Invoice
    Client -->|Dostęp| Message
    Client -->|Dostęp| Notif
    Client -->|Dostęp| Profile
    
    Mechanic -->|Dostęp| Auth
    Mechanic -->|Dostęp| Order
    Mechanic -->|Dostęp| Booking
    Mechanic -->|Dostęp| Invoice
    Mechanic -->|Dostęp| Message
    Mechanic -->|Dostęp| Notif
    Mechanic -->|Dostęp| Parts
    Mechanic -->|Dostęp| Analytics
    Mechanic -->|Dostęp| Profile
    
    Admin -->|Dostęp| Auth
    Admin -->|Dostęp| AdminPanel
    Admin -->|Dostęp| Analytics
    Admin -->|Dostęp| Profile
    
    System -->|Generuje| Notif
    
    classDef actors fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef categories fill:#fffde7,stroke:#f57f17,stroke-width:2px
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:1px
    classDef mechanic fill:#f3e5f5,stroke:#6a1b9a,stroke-width:1px
    classDef admin fill:#fff3e0,stroke:#e65100,stroke-width:1px
    classDef system fill:#e8f5e9,stroke:#1b5e20,stroke-width:1px
    
    class Actors actors
    class Categories categories
    class Client client
    class Mechanic mechanic
    class Admin admin
    class System system
```

**Statystyka**:
- ✅ **45 Przypadków Użycia** (UC1-UC45)
- ✅ **4 Aktorów** z pełnym dostępem
- ✅ **12 Kategorii Funkcjonalności**
- ✅ **Logiczne relacje** między komponentami

---

## 📊 DIAGRAM 1️⃣: KLIENT (Customer)

```mermaid
graph TD
    Client["👤 KLIENT"]
    
    subgraph Auth["🔐 AUTENTYKACJA"]
        UC1["Rejestracja"]
        UC2["Logowanie"]
        UC3["Reset Hasła"]
    end
    
    subgraph Vehicle["🚗 POJAZDY"]
        UC5["Dodaj Pojazd"]
        UC6["Edytuj Pojazd"]
        UC7["Usuń Pojazd"]
        UC8["Historia"]
    end
    
    subgraph Order["🔧 ZLECENIA"]
        UC9["Nowe Zlecenie"]
        UC10["Przeglądaj"]
        UC14["Śledzenie"]
    end
    
    subgraph Search["🔍 WYSZUKIWANIE"]
        UC15["Szukaj Serwisów"]
        UC16["Filtruj"]
        UC17["Porównaj Ceny"]
        UC18["Rating"]
    end
    
    subgraph Booking["📅 REZERWACJA"]
        UC19["Dostępne Terminy"]
        UC20["Zarezerwuj"]
    end
    
    subgraph Billing["📄 FAKTURY"]
        UC24["Przeglądaj"]
        UC25["Opłać"]
    end
    
    subgraph Comm["💬 KOMUNIKACJA"]
        UC27["Wysłanie Wiadomości"]
        UC28["Chat"]
        UC30["Powiadomienia"]
    end
    
    subgraph Profile["👤 PROFIL"]
        UC43["Przeglądaj Profil"]
        UC44["Edytuj Profil"]
        UC45["Zmień Hasło"]
    end
    
    Client --> Auth
    Client --> Vehicle
    Client --> Order
    Client --> Search
    Client --> Booking
    Client --> Billing
    Client --> Comm
    Client --> Profile
    
    UC9 -.->|extends| UC10
    UC20 -.->|extends| UC19
    UC25 -.->|extends| UC24
    
    classDef client fill:#e1f5ff,stroke:#01579b,stroke-width:3px
    classDef group fill:#fffde7,stroke:#f57f17,stroke-width:2px
    classDef uc fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px
    
    class Client client
    class Auth,Vehicle,Order,Search,Booking,Billing,Comm,Profile group
    class UC1,UC2,UC3,UC5,UC6,UC7,UC8,UC9,UC10,UC14,UC15,UC16,UC17,UC18,UC19,UC20,UC24,UC25,UC27,UC28,UC30,UC43,UC44,UC45 uc
```

**Liczba UC**: 24  
**Główne funkcjonalności**: Zarządzanie pojazdem, wyszukiwanie serwisu, rezerwacja, płatności, komunikacja

---

## 📊 DIAGRAM 2️⃣: MECHANIK/SERWIS (Service Worker)

```mermaid
graph TD
    Mechanic["🔧 MECHANIK/SERWIS"]
    
    subgraph Auth2["🔐 AUTENTYKACJA"]
        UC1B["Rejestracja"]
        UC2B["Logowanie"]
        UC3B["Reset Hasła"]
    end
    
    subgraph Orders["📋 ZLECENIA"]
        UC10B["Przeglądaj"]
        UC11B["Zmień Status"]
        UC12B["Zaakceptuj"]
        UC13B["Odrzuć"]
        UC14B["Ukończ"]
    end
    
    subgraph Schedule["📅 HARMONOGRAM"]
        UC21B["Zarządzaj"]
        UC22B["Zmień Dostępność"]
    end
    
    subgraph Invoicing["📄 FAKTURY"]
        UC23B["Generuj"]
        UC26B["Zaliczki"]
    end
    
    subgraph Inventory["📦 MAGAZYN"]
        UC40B["Przeglądaj Części"]
        UC41B["Zarządzaj Magazynem"]
        UC42B["Śledź Stok"]
    end
    
    subgraph Comm2["💬 KOMUNIKACJA"]
        UC27B["Wysłanie Wiadomości"]
        UC28B["Chat"]
        UC30B["Powiadomienia"]
    end
    
    subgraph Analytics2["📊 RAPORTY"]
        UC33B["Raporty"]
        UC34B["Statystyki"]
    end
    
    subgraph Profile2["👤 PROFIL"]
        UC43B["Przeglądaj"]
        UC44B["Edytuj"]
    end
    
    Mechanic --> Auth2
    Mechanic --> Orders
    Mechanic --> Schedule
    Mechanic --> Invoicing
    Mechanic --> Inventory
    Mechanic --> Comm2
    Mechanic --> Analytics2
    Mechanic --> Profile2
    
    UC12B -.->|includes| UC11B
    UC13B -.->|includes| UC11B
    UC14B -.->|includes| UC11B
    UC23B -.->|extends| UC14B
    
    classDef mechanic fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    classDef group fill:#fffde7,stroke:#f57f17,stroke-width:2px
    classDef uc fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px
    
    class Mechanic mechanic
    class Auth2,Orders,Schedule,Invoicing,Inventory,Comm2,Analytics2,Profile2 group
    class UC1B,UC2B,UC3B,UC10B,UC11B,UC12B,UC13B,UC14B,UC21B,UC22B,UC23B,UC26B,UC40B,UC41B,UC42B,UC27B,UC28B,UC30B,UC33B,UC34B,UC43B,UC44B uc
```

**Liczba UC**: 28  
**Główne funkcjonalności**: Zarządzanie zleceniami, harmonogram, faktury, magazyn, raportowanie

---

## 📊 DIAGRAM 3️⃣: ADMINISTRATOR (Admin)

```mermaid
graph TD
    Admin["👨‍💼 ADMINISTRATOR"]  
    
    subgraph Auth3["🔐 AUTENTYKACJA"]
        UC2C["Logowanie"]
        UC3C["Reset Hasła"]
    end
    
    subgraph AdminPanel["👥 PANEL ADMIN"]
        UC36C["Zarządzaj Użytkownikami"]
        UC37C["Zarządzaj Serwisami"]
        UC38C["Zarządzaj Rolami"]
        UC39C["Konfiguruj System"]
    end
    
    subgraph Analytics3["📊 ANALITYKA"]
        UC33C["Raporty"]
        UC34C["Statystyki"]
        UC35C["Eksportuj Dane"]
    end
    
    subgraph Profile3["👤 PROFIL"]
        UC43C["Przeglądaj"]
        UC44C["Edytuj"]
    end
    
    Admin --> Auth3
    Admin --> AdminPanel
    Admin --> Analytics3
    Admin --> Profile3
    
    classDef admin fill:#fff3e0,stroke:#e65100,stroke-width:3px
    classDef group fill:#fffde7,stroke:#f57f17,stroke-width:2px
    classDef uc fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px
    
    class Admin admin
    class Auth3,AdminPanel,Analytics3,Profile3 group
    class UC2C,UC3C,UC36C,UC37C,UC38C,UC39C,UC33C,UC34C,UC35C,UC43C,UC44C uc
```

**Liczba UC**: 11  
**Główne funkcjonalności**: Zarządzanie użytkownikami, konfiguracją, raportami

---

## 📊 DIAGRAM 4️⃣: SYSTEM (Automated)

```mermaid
graph TD
    System["🖥️ SYSTEM"]  
    
    subgraph Notifications["🔔 POWIADOMIENIA"]
        UC30S["Wysłanie"]
        UC31S["Oznacz Przeczytane"]
        UC32S["Usuń"]
    end
    
    System --> Notifications
    
    Note["⚙️ Uruchamiane automatycznie:<br/>• Nowe zlecenie<br/>• Zmiana statusu<br/>• Przypomnienia<br/>• Harmonogram"]
    
    classDef system fill:#e8f5e9,stroke:#1b5e20,stroke-width:3px
    classDef group fill:#fffde7,stroke:#f57f17,stroke-width:2px
    classDef uc fill:#ffccbc,stroke:#d84315,stroke-width:1px
    classDef note fill:#f5f5f5,stroke:#757575,stroke-width:1px,font-size:11px
    
    class System system
    class Notifications group
    class UC30S,UC31S,UC32S uc
    class Note note
```

**Liczba UC**: 3  
**Główne funkcjonalności**: Powiadomienia systemowe, automatyczne aktualizacje

---

## 📋 PODSUMOWANIE TABEL

### TABELA 1: AUTENTYKACJA & AUTORYZACJA

| ID | Nazwa | Aktor | Opis |
|----|-------|-------|------|
| UC1 | Rejestracja | Klient, Mechanik | Tworzenie konta |
| UC2 | Logowanie | Wszyscy | Zalogowanie |
| UC3 | Reset Hasła | Wszyscy | Odzyskanie hasła |

---

### TABELA 2: POJAZDY & HISTORIA

| ID | Nazwa | Aktor | Opis |
|----|-------|-------|------|
| UC5 | Dodaj Pojazd | Klient | Dodanie pojazdu do profilu |
| UC6 | Edytuj Pojazd | Klient | Zmiana danych pojazdu |
| UC7 | Usuń Pojazd | Klient | Usunięcie pojazdu |
| UC8 | Historia Pojazdu | Klient, Mechanik | Przegląd historii serwisu |

---

### TABELA 3: ZLECENIA NAPRAW

| ID | Nazwa | Aktor | Opis | Status |
|----|-------|-------|------|--------|
| UC9 | Utwórz Zlecenie | Klient | Nowe zlecenie | pending |
| UC10 | Przeglądaj | Klient, Mechanik | Lista zleceń | - |
| UC11 | Zmień Status | Mechanik | Aktualizacja statusu | any |
| UC12 | Zaakceptuj | Mechanik | Przyjęcie zlecenia | pending→accepted |
| UC13 | Odrzuć | Mechanik | Odrzucenie | pending→rejected |
| UC14 | Ukończ | Mechanik | Zakończenie | in-progress→completed |

---

### TABELA 4: WYSZUKIWANIE & REZERWACJA

| ID | Nazwa | Aktor | Opis |
|----|-------|-------|------|
| UC15 | Szukaj Serwisów | Klient | Wyszukiwanie serwisów |
| UC16 | Filtruj | Klient | Filtrowanie po specjalizacji |
| UC17 | Porównaj Ceny | Klient | Porównanie cen |
| UC18 | Rating | Klient | Sprawdzenie ocen |
| UC19 | Dostępne Terminy | Klient | Przeglądanie dostępności |
| UC20 | Zarezerwuj | Klient | Rezerwacja terminu |

---

### TABELA 5: FAKTURY & PŁATNOŚCI

| ID | Nazwa | Aktor | Opis |
|----|-------|-------|------|
| UC23 | Generuj Fakturę | Mechanik | Tworzenie faktury |
| UC24 | Przeglądaj Faktury | Klient, Mechanik | Lista faktur |
| UC25 | Opłać Fakturę | Klient | Dokonanie płatności |
| UC26 | Zarządzaj Zaliczkami | Mechanik | Obsługa zaliczek |

---

### TABELA 6: WIADOMOŚCI & POWIADOMIENIA

| ID | Nazwa | Aktor | Opis |
|----|-------|-------|------|
| UC27 | Wysłanie Wiadomości | Klient, Mechanik | Wysłanie wiadomości |
| UC28 | Chat | Klient, Mechanik | Przegląd wiadomości |
| UC29 | Wątek Wiadomości | Klient, Mechanik | Nowy wątek |
| UC30 | Powiadomienia | Wszyscy | Otrzymanie powiadomienia |
| UC31 | Oznacz Przeczytane | Wszyscy | Oznaczenie jako przeczytane |
| UC32 | Usuń Powiadomienie | System | Usunięcie powiadomienia |

---

### TABELA 7: MAGAZYN & CZĘŚCI

| ID | Nazwa | Aktor | Opis |
|----|-------|-------|------|
| UC40 | Przeglądaj Części | Mechanik | Wyszukiwanie w magazynie |
| UC41 | Zarządzaj Magazynem | Mechanik | CRUD części |
| UC42 | Śledź Stok | Mechanik | Monitorowanie dostępności |

---

### TABELA 8: ADMINISTRACJA

| ID | Nazwa | Aktor | Opis |
|----|-------|-------|------|
| UC36 | Zarządzaj Użytkownikami | Admin | CRUD użytkowników |
| UC37 | Zarządzaj Serwisami | Admin | CRUD serwisów |
| UC38 | Zarządzaj Rolami | Admin | Definiowanie uprawnień |
| UC39 | Konfiguruj System | Admin | Ustawienia platformy |

---

### TABELA 9: ANALITYKA & RAPORTY

| ID | Nazwa | Aktor | Opis |
|----|-------|-------|------|
| UC33 | Raporty | Mechanik, Admin | Raporty wydajności |
| UC34 | Statystyki | Mechanik, Admin | Dane statystyczne |
| UC35 | Eksportuj Dane | Admin | Export do CSV/PDF |

---

### TABELA 10: PROFIL UŻYTKOWNIKA

| ID | Nazwa | Aktor | Opis |
|----|-------|-------|------|
| UC43 | Przeglądaj Profil | Wszyscy | Wyświetlenie profilu |
| UC44 | Edytuj Profil | Wszyscy | Zmiana danych |
| UC45 | Zmień Hasło | Wszyscy | Zmiana hasła logowania |

---

## 🔄 RELACJE MIĘDZY UC

### Include (Zawiera)
- UC12 (Zaakceptuj) **includes** UC11 (Zmień Status)
- UC13 (Odrzuć) **includes** UC11 (Zmień Status)
- UC14 (Ukończ) **includes** UC11 (Zmień Status)

### Extend (Rozszerza)
- UC9 (Utwórz) **extends** UC10 (Przeglądaj)
- UC23 (Generuj Fakturę) **extends** UC14 (Ukończ)
- UC20 (Zarezerwuj) **extends** UC19 (Dostępne Terminy)
- UC27 (Wysłanie Wiadomości) **extends** UC29 (Wątek)

---

## 📊 STATYSTYKA UC PO KATEGORII

| Kategoria | Liczba | Opis |
|-----------|--------|------|
| Autentykacja | 3 | Login, Register, Reset |
| Pojazdy | 4 | CRUD + Historia |
| Zlecenia | 6 | Create, Read, Update (Accept, Reject, Complete) |
| Wyszukiwanie | 4 | Search, Filter, Compare, Rate |
| Rezerwacja | 2 | View, Book |
| Faktury | 4 | Generate, View, Pay, Deposits |
| Wiadomości | 4 | Send, Chat, Threads, Create |
| Powiadomienia | 3 | Receive, Mark, Delete |
| Magazyn | 3 | View, Manage, Track |
| Admin | 4 | Users, Services, Roles, Config |
| Analityka | 3 | Reports, Stats, Export |
| Profil | 3 | View, Edit, Password |
| **RAZEM** | **45** | **Wszystkie UC** |

---

## 👥 ROZKŁAD UC PO AKTORACH

| Aktor | Liczba UC | Procent |
|-------|-----------|--------|
| **Klient** | 24 | 53% |
| **Mechanik** | 28 | 62% |
| **Admin** | 11 | 24% |
| **System** | 3 | 7% |

---

## 🎯 SCENARIUSZE GŁÓWNE

### Scenariusz 1: Klient rezerwuje naprawę
1. Loguje się (UC2)
2. Dodaje pojazd (UC5)
3. Tworzy zlecenie (UC9)
4. Wyszukuje serwis (UC15)
5. Rezerwuje termin (UC20)
6. Wysyła wiadomość (UC27)

### Scenariusz 2: Mechanik realizuje zlecenie
1. Loguje się (UC2)
2. Przegląda zlecenia (UC10)
3. Zaakceptuje (UC12)
4. Zmienia status (UC11)
5. Generuje fakturę (UC23)
6. Wysyła notyfikację (System)

### Scenariusz 3: Klient opłaca fakturę
1. Przegląda faktury (UC24)
2. Opłaca (UC25)
3. Otrzymuje potwierdzenie (UC30)

### Scenariusz 4: Admin zarządza
1. Loguje się (UC2)
2. Zarządza użytkownikami (UC36)
3. Przegląda raporty (UC33)
4. Eksportuje dane (UC35)

---

## ✅ PODSUMOWANIE

✅ **45 Przypadków Użycia** pokrywających całą aplikację  
✅ **4 Aktorów** z wytyczonym zakresem  
✅ **10 Kategorii funkcjonalności**  
✅ **Wyraźne scenariusze** dla każdegoflow  
✅ **Czytelne diagramy** podzielone po aktorach

---

**Stworzono**: Luty 2026  
**Autor**: GitHub Copilot  
**Wersja**: 2.0 (Ulepszona czytelność)

# 📈 DIAGRAM SEKWENCJI (Sequence Diagrams)

**Projekt**: AutoRepair - Platforma do zarządzania naprawami samochodów  
**Data**: Luty 2026

---

## 🎭 DIAGRAMY SEKWENCJI - MERMAID

---

## 📊 DIAGRAM 0️⃣: OGÓLNY PRZEPŁYW SYSTEMU (Complete User Journey)

```mermaid
sequenceDiagram
    participant User as 👤 Użytkownik
    participant Frontend as 📱 Frontend React
    participant API as 🔗 API Backend
    participant DB as 💾 Database SQLite
    participant EmailSvc as 📧 Email Service
    participant PaymentGW as 💳 Payment Gateway

    Note over User,PaymentGW: 1️⃣ AUTENTYKACJA
    User->>Frontend: Otwiera aplikację
    User->>Frontend: Rejestruje się
    Frontend->>API: POST /auth/register
    API->>DB: INSERT user
    API-->>Frontend: JWT Token

    Note over User,PaymentGW: 2️⃣ DODANIE POJAZDU
    User->>Frontend: Przechodzi do "Pojazdy"
    User->>Frontend: Dodaje pojazd
    Frontend->>API: POST /vehicles
    API->>DB: INSERT vehicle
    API-->>Frontend: vehicle_id

    Note over User,PaymentGW: 3️⃣ TWORZENIE ZLECENIA
    User->>Frontend: Otwiera "Nowe Zlecenie"
    User->>Frontend: Opisuje usterkę, wybiera serwis
    Frontend->>API: POST /orders
    API->>DB: INSERT order<br/>INSERT message_thread<br/>INSERT notifications
    API->>EmailSvc: Wyślij email do serwisu
    API-->>Frontend: order_id

    Note over User,PaymentGW: 4️⃣ KOMUNIKACJA
    User->>Frontend: Wysyła wiadomość do mechanika
    Frontend->>API: POST /messages
    API->>DB: INSERT message
    API-->>Frontend: message_id

    Note over User,PaymentGW: 5️⃣ ŚLEDZENIE STATUS
    User->>Frontend: Przegląda swoje zlecenia
    loop Co kilka minut
        Frontend->>API: GET /orders
        API->>DB: SELECT orders
        API-->>Frontend: orders_list
        Frontend->>User: Wyświetla status
    end

    Note over User,PaymentGW: 6️⃣ GENEROWANIE FAKTURY
    par Mechanik
        rect rgb(200, 150, 255)
        Note over API: Mechanik ukańcza zlecenie
        API->>DB: UPDATE orders (status=completed)
        API->>DB: INSERT invoice
        API->>EmailSvc: Wyślij fakturę
        end
    and Klient
        User->>Frontend: Przegląda faktury
        Frontend->>API: GET /invoices
        API-->>Frontend: invoice_data
    end

    Note over User,PaymentGW: 7️⃣ PŁATNOŚĆ
    User->>Frontend: Klika "Opłać"
    Frontend->>PaymentGW: Redirect do Payment Gateway
    User->>PaymentGW: Wpisuje dane karty
    PaymentGW->>PaymentGW: Przetwarza płatność
    PaymentGW-->>Frontend: Webhook success
    Frontend->>API: POST /invoices/{id}/payment
    API->>DB: UPDATE invoices (status=paid)
    API->>EmailSvc: Wyślij potwierdzenie płatności
    API-->>Frontend: 200 OK

    Note over User,PaymentGW: ✅ PROCES ZAKOŃCZONY
    Frontend->>User: Wyświetla potwierdzenie
    User->>User: Otrzymuje powiadomienia i emaile
```

**Ogólny przepływ**:
1. ✅ Rejestracja i Login
2. ✅ Dodanie pojazdu
3. ✅ Zgłoszenie usterki (zlecenie)
4. ✅ Komunikacja z mechanikiem
5. ✅ Śledzenie statusu
6. ✅ Generowanie faktury
7. ✅ Płatność
8. ✅ Potwierdzenie

---

### 1. SCENARIUSZ: REJESTRACJA I LOGOWANIE

```mermaid
sequenceDiagram
    participant Client as 👤 Klient (Frontend)
    participant API as 🔗 API Backend
    participant DB as 💾 Database
    participant Auth as 🔐 Auth Service

    Client->>API: POST /auth/register<br/>(email, hasło, imię)
    activate API
    
    API->>Auth: Walidacja danych
    activate Auth
    Auth-->>API: OK - Dane poprawne
    deactivate Auth
    
    API->>Auth: Haszowanie hasła (bcrypt)
    activate Auth
    Auth-->>API: Haszowany_hasło
    deactivate Auth
    
    API->>DB: INSERT INTO users<br/>(email, hasło_hash, rola='customer')
    activate DB
    DB-->>API: user_id = 401
    deactivate DB
    
    API-->>Client: 201 Created<br/>{user_id, token}
    deactivate API
    
    Note over Client: ✅ Konto utworzone!
    
    Client->>API: POST /auth/login<br/>(email, hasło)
    activate API
    
    API->>DB: SELECT * FROM users WHERE mail=?
    activate DB
    DB-->>API: user_record
    deactivate DB
    
    API->>Auth: bcrypt.compare(hasło, hash)
    activate Auth
    Auth-->>API: true/false
    deactivate Auth
    
    alt Hasło poprawne
        API->>Auth: JWT.sign({user_id, rola})
        activate Auth
        Auth-->>API: JWT_TOKEN
        deactivate Auth
        API-->>Client: 200 OK<br/>{token, rola, user_id}
    else Hasło błędne
        API-->>Client: 401 Unauthorized
    end
    
    deactivate API
    Note over Client: ✅ Zalogowano!
```

---

### 2. SCENARIUSZ: TWORZENIE POJAZDU

```mermaid
sequenceDiagram
    participant Client as 👤 Klient (Frontend)
    participant API as 🔗 API Backend
    participant Auth as 🔐 Auth Middleware
    participant DB as 💾 Database
    participant Validation as ✓ Validator

    Client->>API: POST /vehicles<br/>(make, model, year, plate, vin)<br/>+ Bearer Token
    activate API
    
    API->>Auth: Sprawdź token i rolę
    activate Auth
    Auth-->>API: {user_id: 401, rola: 'customer'}
    deactivate Auth
    
    API->>Validation: Walidacja danych pojazdu
    activate Validation
    Validation-->>API: OK
    deactivate Validation
    
    API->>DB: INSERT INTO vehicles<br/>(customer_id, make, model, year, plate, vin)
    activate DB
    DB-->>API: vehicle_id = 1001
    deactivate DB
    
    API-->>Client: 201 Created<br/>{vehicle_id, make, model, ...}
    deactivate API
    
    Note over Client: ✅ Pojazd dodany!
    Client->>Client: Refresh lista pojazdów
```

---

### 3. SCENARIUSZ: KLIENT TWORZY ZLECENIE

```mermaid
sequenceDiagram
    participant Client as 👤 Klient (Frontend)
    participant API as 🔗 API Backend
    participant OrderCtrl as 📋 Order Controller
    participant DB as 💾 Database
    participant NotifCtrl as 🔔 Notification Controller

    Client->>API: POST /orders<br/>(vehicle_id, description, budget, preferred_date, supplier_id)<br/>+ Token
    activate API
    
    API->>OrderCtrl: createOrder(data, user_id)
    activate OrderCtrl
    
    OrderCtrl->>DB: INSERT INTO orders<br/>(customer_id, vehicle_id, status='pending', opis, ...)<br/>→ order_id = 5001
    activate DB
    deactivate DB
    
    OrderCtrl->>DB: INSERT INTO message_threads<br/>(title, customer_id, order_id)<br/>→ thread_id = 301
    activate DB
    deactivate DB
    
    OrderCtrl->>NotifCtrl: triggerNotification(supplier_id, order_id)
    activate NotifCtrl
    
    NotifCtrl->>DB: INSERT INTO notifications<br/>(user_id, title, body)<br/>WHERE user_id = supplier_mechanic_id
    activate DB
    DB-->>NotifCtrl: notification_id
    deactivate DB
    
    NotifCtrl-->>OrderCtrl: OK
    deactivate NotifCtrl
    
    OrderCtrl-->>API: {order_id: 5001, status: 'pending', thread_id: 301}
    deactivate OrderCtrl
    
    API-->>Client: 201 Created
    deactivate API
    
    Note over Client: ✅ Zlecenie wysłane!
    
    par Równoległy przepływ
        Note over API: Powiadomienie wysyłane do mechanika
        Note over API: Email/SMS (jeśli skonfigurowany)
    end
```

---

### 4. SCENARIUSZ: MECHANIK AKCEPTUJE ZLECENIE

```mermaid
sequenceDiagram
    participant Mechanic as 🔧 Mechanik (Frontend)
    participant API as 🔗 API Backend
    participant OrderCtrl as 📋 Order Controller
    participant DB as 💾 Database
    participant NotifCtrl as 🔔 Notification Controller

    Mechanic->>API: PUT /orders/5001<br/>(status='accepted')<br/>+ Token
    activate API
    
    API->>OrderCtrl: updateOrderStatus(order_id, status, mechanic_id)
    activate OrderCtrl
    
    OrderCtrl->>DB: SELECT * FROM orders WHERE id=5001
    activate DB
    DB-->>OrderCtrl: order_data
    deactivate DB
    
    OrderCtrl->>DB: UPDATE orders<br/>SET status='accepted', mechanic_user_id=<mechanic_id>
    activate DB
    DB-->>OrderCtrl: 1 row updated
    deactivate DB
    
    OrderCtrl->>NotifCtrl: triggerNotification(customer_id, "Zlecenie zaakceptowane")
    activate NotifCtrl
    
    NotifCtrl->>DB: INSERT INTO notifications<br/>(user_id, title='Zlecenie #5001 zaakceptowane', body=...)
    activate DB
    DB-->>NotifCtrl: notification_id
    deactivate DB
    
    NotifCtrl-->>OrderCtrl: OK
    deactivate NotifCtrl
    
    OrderCtrl-->>API: {order_id, status: 'accepted', mechanic_id}
    deactivate OrderCtrl
    
    API-->>Mechanic: 200 OK
    deactivate API
    
    Note over Mechanic: ✅ Zlecenie zaakceptowane!
    Note over Mechanic: Klient otrzyma powiadomienie
```

    ---

    ### 4A. SCENARIUSZ: RECEPCJA TWORZY ZLECENIE Z WIZYTY I PRZYPISUJE MECHANIKA

    ```mermaid
    sequenceDiagram
        participant Reception as 🧑‍💼 Recepcja
        participant Frontend as 📱 Frontend
        participant API as 🔗 API Backend
        participant DB as 💾 Database

        Reception->>Frontend: Otwiera szczegóły wizyty
        Frontend->>API: GET /appointments/:id
        API->>DB: SELECT appointment
        API-->>Frontend: appointment

        Reception->>Frontend: Pobiera listę mechaników
        Frontend->>API: GET /users/mechanics
        API->>DB: SELECT users WHERE rola='mechanik'
        API-->>Frontend: mechanics_list

        Reception->>Frontend: Wybiera mechanika i klika "Utwórz zlecenie"
        Frontend->>API: POST /orders<br/>(customer_id, vehicle_id, service, mechanic_user_id)
        API->>DB: INSERT order
        API-->>Frontend: order_id

        Frontend->>API: PATCH /appointments/:id<br/>(order_id)
        API->>DB: UPDATE appointments
        API-->>Frontend: OK

        Frontend->>Reception: Przekierowanie do zleceń
    ```

---

### 5. SCENARIUSZ: WYSŁANIE WIADOMOŚCI

```mermaid
sequenceDiagram
    participant Mechanic as 🔧 Mechanik
    participant Frontend as 📱 Frontend
    participant API as 🔗 API Backend
    participant MessageCtrl as 💬 Message Controller
    participant DB as 💾 Database

    Mechanic->>Frontend: Otwiera chat z klientem
    Frontend->>API: GET /message-threads/301<br/>+ Token
    activate API
    
    API->>MessageCtrl: getThreadById(thread_id, user_id)
    activate MessageCtrl
    
    MessageCtrl->>DB: SELECT * FROM message_threads WHERE id=301
    activate DB
    DB-->>MessageCtrl: thread_data
    deactivate DB
    
    MessageCtrl->>DB: SELECT * FROM messages WHERE thread_id=301<br/>ORDER BY created_at DESC LIMIT 50
    activate DB
    DB-->>MessageCtrl: messages_list
    deactivate DB
    
    MessageCtrl-->>API: {thread_data, messages}
    deactivate MessageCtrl
    
    API-->>Frontend: 200 OK<br/>{thread, messages}
    deactivate API
    
    Frontend->>Frontend: Wyświetla wiadomości
    
    Mechanic->>Frontend: Wpisuje wiadomość: "Bateria będzie wymieniona"
    Mechanic->>Frontend: Klika "Wyślij"
    
    Frontend->>API: POST /messages<br/>{thread_id: 301, text: "...", sender_user_id: 12}
    activate API
    
    API->>MessageCtrl: createMessage(data, user_id)
    activate MessageCtrl
    
    MessageCtrl->>DB: INSERT INTO messages<br/>(thread_id, sender_user_id, text, created_at)
    activate DB
    DB-->>MessageCtrl: message_id = 8901
    deactivate DB
    
    MessageCtrl->>DB: UPDATE message_threads<br/>SET updated_at=NOW() WHERE id=301
    activate DB
    DB-->>MessageCtrl: OK
    deactivate DB
    
    MessageCtrl-->>API: {message_id, created_at, sender_user_id}
    deactivate MessageCtrl
    
    API-->>Frontend: 201 Created
    deactivate API
    
    Frontend->>Frontend: Dodaje wiadomość do listy
    Frontend->>Frontend: Scroll do dołu
    
    Note over Mechanic: ✅ Wiadomość wysłana!
    Note over Frontend: Wiadomość pojawia się<br/>po prawej stronie (me)
```

---

### 6. SCENARIUSZ: UKOŃCZENIE ZLECENIA I GENEROWANIE FAKTURY

```mermaid
sequenceDiagram
    participant Mechanic as 🔧 Mechanik
    participant Frontend as 📱 Frontend
    participant API as 🔗 API Backend
    participant OrderCtrl as 📋 Order Controller
    participant InvoiceCtrl as 📄 Invoice Controller
    participant DB as 💾 Database

    Mechanic->>Frontend: Otwiera zlecenie #5001
    Mechanic->>Frontend: Klika "Ukończ Zlecenie"
    
    Frontend->>API: PUT /orders/5001<br/>(status='completed', cost: 450.00)<br/>+ Token
    activate API
    
    API->>OrderCtrl: updateOrderStatus(5001, 'completed', mechanic_id)
    activate OrderCtrl
    
    OrderCtrl->>DB: UPDATE orders<br/>SET status='completed', end_at=NOW()
    activate DB
    DB-->>OrderCtrl: 1 row updated
    deactivate DB
    
    OrderCtrl->>InvoiceCtrl: generateInvoice(order_id, amount)
    activate InvoiceCtrl
    
    InvoiceCtrl->>DB: SELECT * FROM orders WHERE id=5001
    activate DB
    DB-->>InvoiceCtrl: order_data
    deactivate DB
    
    InvoiceCtrl->>InvoiceCtrl: Pobierz ostatni numer<br/>faktury + 1
    InvoiceCtrl->>InvoiceCtrl: Wygeneruj PDF
    
    InvoiceCtrl->>DB: INSERT INTO invoices<br/>(number, customer_id, order_id, amount, status='pending', pdf_path)
    activate DB
    DB-->>InvoiceCtrl: invoice_id = 2001
    deactivate DB
    
    InvoiceCtrl-->>OrderCtrl: {invoice_id, pdf_path}
    deactivate InvoiceCtrl
    
    OrderCtrl-->>API: {order_id, status: 'completed', invoice_id}
    deactivate OrderCtrl
    
    API-->>Frontend: 200 OK
    deactivate API
    
    Frontend->>Frontend: Wyświetla modal "Zlecenie ukończone"
    Note over Mechanic: ✅ Zlecenie ukończone!
    Note over Mechanic: Faktura wygenerowana
    
    Mechanic->>Frontend: Klika "Pobierz Fakturę"
    Frontend->>API: GET /invoices/2001/download
    activate API
    API-->>Frontend: PDF Binary
    deactivate API
    
    Frontend->>Frontend: Download PDF
    Note over Mechanic: ✅ Faktura pobrana!
```

---

### 7. SCENARIUSZ: KLIENT OPŁACA FAKTURĘ

```mermaid
sequenceDiagram
    participant Client as 👤 Klient
    participant Frontend as 📱 Frontend
    participant PaymentGateway as 💳 Payment Gateway<br/>(Stripe/PayPal)
    participant API as 🔗 API Backend
    participant InvoiceCtrl as 📄 Invoice Controller
    participant DB as 💾 Database
    participant NotifCtrl as 🔔 Notification

    Client->>Frontend: Przegląda faktury
    Frontend->>API: GET /invoices (user_id, status='pending')
    activate API
    API-->>Frontend: Lista faktur
    deactivate API
    
    Frontend->>Frontend: Wyświetla fakturę #2001
    Client->>Frontend: Klika "Opłać Teraz"
    
    Frontend->>Frontend: Redirect do Payment Gateway
    Frontend->>PaymentGateway: Formularz płatności<br/>(kwota: 450.00 PLN)
    activate PaymentGateway
    
    Client->>PaymentGateway: Wpisuje dane karty
    Client->>PaymentGateway: Klika "Zapłać"
    
    PaymentGateway->>PaymentGateway: Przetwarza płatność
    PaymentGateway-->>Frontend: webhook success<br/>(transaction_id)
    deactivate PaymentGateway
    
    Frontend->>API: POST /invoices/2001/payment<br/>(transaction_id, amount)
    activate API
    
    API->>InvoiceCtrl: confirmPayment(invoice_id, transaction_id)
    activate InvoiceCtrl
    
    InvoiceCtrl->>DB: UPDATE invoices<br/>SET status='paid', paid_at=NOW()<br/>WHERE id=2001
    activate DB
    DB-->>InvoiceCtrl: 1 row updated
    deactivate DB
    
    InvoiceCtrl->>NotifCtrl: triggerNotification<br/>(mechanic_id, "Płatność odebrана")<br/>(customer_id, "Płatność potwierdzona")
    activate NotifCtrl
    
    NotifCtrl->>DB: INSERT INTO notifications (x2)
    activate DB
    DB-->>NotifCtrl: OK
    deactivate DB
    
    NotifCtrl-->>InvoiceCtrl: OK
    deactivate NotifCtrl
    
    InvoiceCtrl-->>API: {invoice_id, status: 'paid'}
    deactivate InvoiceCtrl
    
    API-->>Frontend: 200 OK
    deactivate API
    
    Frontend->>Frontend: Wyświetla potwierdzenie
    Note over Client: ✅ Płatność potwierdzona!
    Note over Frontend: Faktura #2001<br/>STATUS: OPŁACONA ✓
```

---

### 8. SCENARIUSZ: ADMIN ZARZĄDZA UŻYTKOWNIKAMI

```mermaid
sequenceDiagram
    participant Admin as 👨‍💼 Administrator
    participant Frontend as 📱 Frontend
    participant API as 🔗 API Backend
    participant AdminCtrl as 👥 Admin Controller
    participant Auth as 🔐 Auth Middleware
    participant DB as 💾 Database

    Admin->>Frontend: Loguje się jako admin
    Frontend->>API: POST /auth/login (admin_email, password)
    activate API
    API-->>Frontend: JWT Token {rola: 'admin'}
    deactivate API
    
    Admin->>Frontend: Otwiera "Panel Administratora"
    Frontend->>API: GET /admin/users<br/>+ Bearer Token
    activate API
    
    API->>Auth: Sprawdź token i rolę
    activate Auth
    Auth->>Auth: Token.rola === 'admin' ?
    Auth-->>API: ✓ OK
    deactivate Auth
    
    API->>AdminCtrl: listUsers(page, limit)
    activate AdminCtrl
    
    AdminCtrl->>DB: SELECT * FROM users LIMIT 20
    activate DB
    DB-->>AdminCtrl: users_list
    deactivate DB
    
    AdminCtrl-->>API: {users, total_count}
    deactivate AdminCtrl
    
    API-->>Frontend: 200 OK
    deactivate API
    
    Frontend->>Frontend: Wyświetla tabelę użytkowników
    
    Admin->>Frontend: Klika ikona blokady<br/>obok użytkownika
    Frontend->>API: PUT /admin/users/401<br/>(status: 'inactive', reason: 'Spam')<br/>+ Token
    activate API
    
    API->>Auth: Sprawdzenie uprawnień
    activate Auth
    Auth-->>API: ✓ OK - Admin
    deactivate Auth
    
    API->>AdminCtrl: updateUserStatus(user_id, status)
    activate AdminCtrl
    
    AdminCtrl->>DB: UPDATE users<br/>SET status='inactive'<br/>WHERE id=401
    activate DB
    DB-->>AdminCtrl: 1 row updated
    deactivate DB
    
    AdminCtrl-->>API: {user_id, status: 'inactive'}
    deactivate AdminCtrl
    
    API-->>Frontend: 200 OK
    deactivate API
    
    Frontend->>Frontend: Aktualizuje wiersz w tabeli
    Note over Admin: ✅ Użytkownik zablokowany!
    Note over Admin: Status zmieniony na "Inactive"
```

---

### 9. SCENARIUSZ: SYSTEM WYSYŁA POWIADOMIENIA

```mermaid
sequenceDiagram
    participant System as 🖥️ System<br/>(Background Job)
    participant DB as 💾 Database
    participant NotifCtrl as 🔔 Notification Service
    participant EmailService as 📧 Email Service
    participant Client as 👤 Klient

    loop Co 5 minut
        System->>System: Sprawdzenie zadań
    end
    
    Note over System: ⏰ Uruchamia cykliczną<br/>procedurę powiadomień
    
    System->>DB: SELECT * FROM orders<br/>WHERE status='accepted'<br/>AND created_at < NOW()-24h
    activate DB
    DB-->>System: orders_list
    deactivate DB
    
    System->>NotifCtrl: processNotifications(orders)
    activate NotifCtrl
    
    loop Dla każdego rozkładu prac
        NotifCtrl->>DB: SELECT customer_id<br/>FROM orders WHERE id=?
        activate DB
        DB-->>NotifCtrl: customer_id
        deactivate DB
        
        NotifCtrl->>DB: INSERT INTO notifications<br/>(user_id, title, body)<br/>+ CREATE_AT
        activate DB
        DB-->>NotifCtrl: notification_id
        deactivate DB
        
        NotifCtrl->>EmailService: sendEmail(customer_email, template)
        activate EmailService
        EmailService-->>EmailService: Wysyła email
        EmailService-->>NotifCtrl: Email sent
        deactivate EmailService
    end
    
    NotifCtrl-->>System: OK - Processed 12 notifications
    deactivate NotifCtrl
    
    Note over System: ✅ Powiadomienia wysłane!
    
    par Klient otrzymuje
        Note over Client: 🔔 Powiadomienie w aplikacji
        Note over Client: 📧 Email: "Zlecenie w trakcie..."
    end
```

---

## 📊 LEGENDA DIAGRAMÓW

### Symbole
- **→** : Synchroniczne wywołanie (wait for response)
- **-->>** : Zwrot/Response
- **rect** : Sekcja kodu (Alternative, Loop, itp.)
- **par** : Równoległy przepływ (parallel execution)
- **activate** : Aktywacja komponentu
- **deactivate** : Deaktywacja komponentu

### Kolory (zależnie od ustawień)
- 🔗 API - Backend
- 💾 Database - SQLite3
- 📱 Frontend - React
- 👤 Aktor - Użytkownik
- 🔐 Auth - Middleware
- 📊 Controller - Business logic

---

## 🎯 GŁÓWNE PRZEPŁYWY

| # | Scenariusz | Uczestnikami | Kluczowe Akcje |
|---|-----------|--------------|-----------------|
| 1 | Rejestracja | Klient ↔ API ↔ DB | Walidacja, Haszowanie, Zapis |
| 2 | Pojazd | Klient ↔ API ↔ DB | Walidacja, INSERT |
| 3 | Zlecenie | Klient ↔ API ↔ DB | INSERT order + thread + notif |
| 4 | Akceptacja | Mechanik ↔ API ↔ DB | UPDATE status + notif |
| 5 | Wiadomości | Mechanik ↔ API ↔ DB | INSERT message |
| 6 | Faktura | Mechanik ↔ API ↔ DB | UPDATE status + INSERT invoice |
| 7 | Płatność | Klient ↔ PaymentGW ↔ API | Przetworzy płatność + UPDATE |
| 8 | Admin | Admin ↔ API ↔ DB | RBAC check + UPDATE user |
| 9 | Powiadomienia | System ↔ API ↔ DB | Background job + Email |

---

## 🔄 TIMING & PERFORMANCE

### Szacunkowe Czasy Odpowiedzi

```
Rejestracja: 200-500ms
├─ Walidacja: 50ms
├─ Haszowanie (bcrypt): 100-200ms
└─ INSERT: 50-150ms

Login: 150-350ms
├─ SELECT user: 50ms
├─ bcrypt.compare: 100-150ms
└─ JWT.sign: 50ms

Tworzenie Zlecenia: 300-700ms
├─ Walidacja: 50ms
├─ INSERT orders: 100ms
├─ INSERT message_thread: 100ms
└─ INSERT notifications: 100-200ms

Wysłanie Wiadomości: 150-400ms
├─ INSERT messages: 100-150ms
└─ UPDATE thread: 50-100ms

Generowanie Faktury: 500-1500ms
├─ Database ops: 200-400ms
├─ PDF generation: 300-800ms
└─ File save: 100-200ms
```

---

## 📋 CHECKLIST DIAGRAMÓW

- [x] Rejestracja i Logowanie
- [x] Tworzenie Pojazdu
- [x] Tworzenie Zlecenia
- [x] Akceptacja Zlecenia
- [x] Wysłanie Wiadomości
- [x] Ukończenie Zlecenia + Faktura
- [x] Płatność Faktury
- [x] Admin Management
- [x] System Notifications

**Razem: 9 diagramów sekwencji**

---

## 🎓 WNIOSKI

1. **Asynchroniczne procesy** - Powiadomienia mogą być wysyłane w tle
2. **Bezpieczeństwo** - Każdy request wymaga token + role check
3. **Konsystencja danych** - Transakcje logiczne (order + thread + notif)
4. **Error Handling** - Każdy diagram zakładał happy path
5. **Performance** - DB queries optymalizowane z indeksami

---

**Stworzono**: Luty 2026  
**Autor**: GitHub Copilot  
**Wersja**: 1.0


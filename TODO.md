# BRAKI DO PEŁNEJ FUNKCJONALNOŚCI (TODO)

## ✅ ZREALIZOWANE

### 1) Kalendarz / Wizyty
- ✅ **UI do zmiany statusu wizyty**: oczekujacy → zaakceptowany → wykonano
- ✅ **Uprawnienia w UI**: recepcja/kierownik/admin mogą zmieniać status, klient tylko podgląd
- ❌ **Opcjonalnie**: walidacja sekwencji statusów po stronie backendu

### 2) Powiązanie wizyty ze zleceniem
- ✅ **Akcja „Utwórz zlecenie z wizyty"**: automatyczne wypełnienie klienta/pojazdu z danych wizyty
- ✅ **Zapisywanie order_id w appointments**: widok powiązania w szczegółach wizyty
- ✅ **UI**: przycisk w szczegółach wizyty do konwersji na zlecenie

### 3) Zlecenia
- ✅ **Wybór mechanika z listy (dropdown)**: zamiast wpisywania ID ręcznie
- ❌ **Opcjonalnie - walidacja przejść statusów**: nowe → w_trakcie → zakonczone/anulowane
- ❌ **Opcjonalnie - automatyczne ustawienie end_at**: przy statusie „zakonczone"

### 5) Uprawnienia i UX
- ✅ **Spójne etykiety statusów w UI (PL)**: mapowanie na wartości backendu
- ❌ **Widoki „moje wizyty" dla klienta**: szybkie filtrowanie i podgląd
- ✅ **Konsystentne tłumaczenia**: wszystkie statusy i komunikaty w języku polskim

---

## ❌ DO WYKONANIA

### 4) Faktury i automatyzacje
- **Automatyczne tworzenie faktury**: po zakończeniu zlecenia (jeśli wymagane)
- **Powiadomienia/email**: przy zmianie statusów (wizyta/zlecenie)
- **System notyfikacji**: backend + frontend integration

## 5) Uprawnienia i UX
- **Spójne etykiety statusów w UI (PL)**: mapowanie na wartości backendu
- **Widoki „moje wizyty" dla klienta**: szybkie filtrowanie i podgląd
- **Konsystentne tłumaczenia**: wszystkie statusy i komunikaty w języku polskim

---

## Priorytety implementacji:

### ✅ KRYTYCZNE (ZREALIZOWANE):
1. ✅ UI do zmiany statusu wizyty w Kalendarz/Kalendarz.tsx
2. ✅ Wybór mechanika z dropdownu w Zlecenia/Zlecenia.tsx

### ✅ WYSOKIE (ZREALIZOWANE):
3. ✅ Powiązanie wizyty ze zleceniem (konwersja)
4. ✅ Spójne etykiety statusów w całej aplikacji

### ❌ ŚREDNIE (do zrobienia):
5. Automatyczne tworzenie faktury
6. System powiadomień
7. Walidacja przejść statusów
8. Widoki „moje wizyty" dla klienta

---

## 📝 Podsumowanie zmian:

### Kalendarz (mobile/src/screens/Kalendarz/Kalendarz.tsx)
- ✅ Dodano modal szczegółów wizyty z pełnymi informacjami
- ✅ Dropdown do zmiany statusu (oczekujący/zaakceptowany/wykonano)
- ✅ Uprawnienia: tylko recepcja/kierownik/admin mogą zmieniać status
- ✅ Przycisk "Utwórz zlecenie" konwertujący wizytę na zlecenie
- ✅ Automatyczne wypełnienie danych zlecenia z wizyty
- ✅ Zapisywanie order_id w appointment po konwersji
- ✅ Wyświetlanie powiązania ze zleceniem

### Zlecenia (mobile/src/screens/Zlecenia/Zlecenia.tsx)
- ✅ Zamiana input mechanika na dropdown z listą mechaników
- ✅ Pobieranie listy użytkowników z API (/admin/users)
- ✅ Filtrowanie tylko mechaników (rola === 'mechanik')
- ✅ Wyświetlanie: Imię Nazwisko (email)

### Statusy (mobile/src/utils/statusHelpers.ts)
- ✅ Utworzono nowy plik pomocniczy
- ✅ Funkcje formatAppointmentStatus, formatOrderStatus, formatInvoiceStatus
- ✅ Mapowanie statusów backendu na polskie etykiety
- ✅ Funkcja getStatusColor dla badge'ów
- ✅ Użycie w Dashboard/HomeScreen.tsx

### Backend
- ✅ Wszystkie endpointy już obsługują nowe statusy
- ✅ Walidacja statusów wizyt: oczekujacy/zaakceptowany/wykonano
- ✅ Walidacja statusów zleceń: nowe/w_trakcie/zakonczone/anulowane

# BRAKI DO PEŁNEJ FUNKCJONALNOŚCI (TODO)

## 1) Kalendarz / Wizyty
- **UI do zmiany statusu wizyty**: oczekujacy → zaakceptowany → wykonano
- **Uprawnienia w UI**: recepcja/kierownik/admin mogą zmieniać status, klient tylko podgląd
- **Opcjonalnie**: walidacja sekwencji statusów po stronie backendu

## 2) Powiązanie wizyty ze zleceniem
- **Akcja „Utwórz zlecenie z wizyty"**: automatyczne wypełnienie klienta/pojazdu z danych wizyty
- **Zapisywanie order_id w appointments**: widok powiązania w szczegółach wizyty
- **UI**: przycisk w szczegółach wizyty do konwersji na zlecenie

## 3) Zlecenia
- **Wybór mechanika z listy (dropdown)**: zamiast wpisywania ID ręcznie
- **Opcjonalnie - walidacja przejść statusów**: nowe → w_trakcie → zakonczone/anulowane
- **Opcjonalnie - automatyczne ustawienie end_at**: przy statusie „zakonczone"

## 4) Faktury i automatyzacje
- **Automatyczne tworzenie faktury**: po zakończeniu zlecenia (jeśli wymagane)
- **Powiadomienia/email**: przy zmianie statusów (wizyta/zlecenie)
- **System notyfikacji**: backend + frontend integration

## 5) Uprawnienia i UX
- **Spójne etykiety statusów w UI (PL)**: mapowanie na wartości backendu
- **Widoki „moje wizyty" dla klienta**: szybkie filtrowanie i podgląd
- **Konsystentne tłumaczenia**: wszystkie statusy i komunikaty w języku polskim

## 6) Dane produkcyjne
- **Mechanizm migracji DB**: zmiany w schemacie + defaulty (versioning)
- **Logi/audyt zmian statusu**: kto i kiedy zmienił status (audit trail)
- **Backup strategy**: automatyczne kopie zapasowe bazy danych

---

## Priorytety implementacji:

### KRYTYCZNE (blokuje podstawowy workflow):
1. UI do zmiany statusu wizyty w Kalendarz/Kalendarz.tsx
2. Wybór mechanika z dropdownu w Zlecenia/Zlecenia.tsx

### WYSOKIE (znacząco poprawia UX):
3. Powiązanie wizyty ze zleceniem (konwersja)
4. Spójne etykiety statusów w całej aplikacji

### ŚREDNIE (nice-to-have):
5. Automatyczne tworzenie faktury
6. System powiadomień
7. Walidacja przejść statusów

### NISKIE (przyszłość):
8. Audit trail
9. System migracji DB
10. Backup automation

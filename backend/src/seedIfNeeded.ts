import bcrypt from "bcrypt";
import { get, run, all } from "./db.js";
import { initDb } from "./dbInit.js";

type IdRow = { id: number };

export async function seedIfNeeded() {

  await initDb();


  const table = await get<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
  );
  if (!table) return;


  const countRow = await get<{ count: number }>(`SELECT COUNT(*) as count FROM users`);
  if (countRow && countRow.count > 0) {
    console.log("ℹ️ Baza już zawiera dane — seed pominięty");
    return;
  }

  console.log("🌱 Pusta baza — wykonuję seed...");


  const users = [
    { imie: "Test", nazwisko: "User", mail: "test@example.com", telefon: "123456789", rola: "user", haslo: "password123" },
    { imie: "Admin", nazwisko: "User", mail: "admin@example.com", telefon: "987654321", rola: "admin", haslo: "admin123" }
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.haslo, 10);
    await run(
      `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [u.imie, u.nazwisko, u.mail, u.telefon, u.rola, hashed]
    );
    console.log(`✅ Created user: ${u.mail} (password: ${u.haslo})`);
  }

  const admin = await get<IdRow>(`SELECT id FROM users WHERE mail = ?`, ["admin@example.com"]);
  const testUser = await get<IdRow>(`SELECT id FROM users WHERE mail = ?`, ["test@example.com"]);


  const cust = await run(
    `INSERT INTO customers (name, email, phone, notes)
     VALUES (?, ?, ?, ?)`,
    ["Jan Kowalski", "jan.kowalski@example.com", "111222333", "Klient testowy"]
  );
  const customerId = cust.lastID;



  const veh = await run(
    `INSERT INTO vehicles (customer_id, make, model, year, plate, vin)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [customerId, "Toyota", "Corolla", 2016, "WX12345", "VINTEST1234567890"]
  );
  const vehicleId = veh.lastID;


  await run(
    `INSERT INTO orders
      (service, status, opis, customer_id, vehicle_id, mechanic_user_id, created_by_user_id, start_at, end_at)
     VALUES
      (?, 'nowe', ?, ?, ?, ?, ?, datetime('now'), NULL)`,
    [
      "Wymiana oleju i filtrów",
      "Wymiana oleju + filtr oleju + kontrola płynów",
      customerId,
      vehicleId,
      null, // mechanic_user_id
      testUser?.id ?? admin?.id ?? null // created_by_user_id
    ]
  );


  const order = await get<IdRow>(`SELECT id FROM orders ORDER BY id DESC LIMIT 1`);
  const orderId = order?.id ?? null;


  await run(
    `INSERT INTO appointments (title, start_at, end_at, status, customer_id, vehicle_id, order_id, notes)
     VALUES (?, datetime('now','+1 day'), datetime('now','+1 day','+1 hour'), 'zaplanowana', ?, ?, ?, ?)`,
    ["Wizyta serwisowa", customerId, vehicleId, orderId, "Przyjechać 10 minut wcześniej"]
  );


  await run(
    `INSERT INTO parts (name, sku, brand, stock, min_stock, price, location)
     VALUES
      ('Filtr oleju', 'FO-TEST-001', 'Bosch', 5, 2, 39.99, 'Regał A1'),
      ('Olej silnikowy 5W30', 'OIL-TEST-001', 'Castrol', 1, 3, 199.99, 'Magazyn główny')`
  );


  await run(
    `INSERT INTO invoices (number, customer_id, order_id, issue_date, due_date, amount, status, pdf_path)
     VALUES (?, ?, ?, date('now'), date('now','+14 day'), ?, 'oczekuje', NULL)`,
    ["FV/TEST/001", customerId, orderId, 499.99]
  );


  const threadRes = await run(
    `INSERT INTO message_threads (title, customer_id, order_id, created_by_user_id, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    ["Kontakt w sprawie naprawy", customerId, orderId, admin?.id ?? null]
  );
  const threadId = threadRes.lastID;

  await run(
    `INSERT INTO messages (thread_id, sender_user_id, sender_customer_id, text)
     VALUES (?, ?, NULL, ?)`,
    [threadId, admin?.id ?? null, "Dzień dobry, potwierdzam przyjęcie auta do serwisu. Dam znać po diagnozie."]
  );


  if (admin?.id) {
    await run(
      `INSERT INTO notifications (user_id, title, body)
       VALUES (?, ?, ?)`,
      [admin.id, "Nowy klient", "Dodano klienta testowego: Jan Kowalski"]
    );
  }
  if (testUser?.id) {
    await run(
      `INSERT INTO notifications (user_id, title, body)
       VALUES (?, ?, ?)`,
      [testUser.id, "Nowe zlecenie", "Utworzono zlecenie: Wymiana oleju i filtrów"]
    );
  }



  console.log("✅ Seed zakończony");
}


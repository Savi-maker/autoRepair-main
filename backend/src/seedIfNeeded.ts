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
    const partsCount = await get<{ count: number }>(`SELECT COUNT(*) as count FROM parts`);
    if (!partsCount || partsCount.count === 0) {
      console.log("ℹ️ Baza ma użytkowników, ale brak części — uzupełniam magazyn...");
      const extraParts = [
        { name: 'Filtr oleju', sku: 'FO-TEST-001', brand: 'Bosch', stock: 5, min: 2, price: 39.99, location: 'Regał A1' },
        { name: 'Olej silnikowy 5W30', sku: 'OIL-TEST-001', brand: 'Castrol', stock: 1, min: 3, price: 199.99, location: 'Magazyn główny' },
        { name: 'Klocki hamulcowe przód', sku: 'BRK-TEST-001', brand: 'ATE', stock: 4, min: 2, price: 249.99, location: 'Regał B2' },
        { name: 'Tarcze hamulcowe przód', sku: 'BRK-TEST-002', brand: 'Zimmermann', stock: 2, min: 2, price: 399.99, location: 'Regał B3' },
        { name: 'Filtr powietrza', sku: 'FLT-TEST-001', brand: 'Hengst', stock: 8, min: 2, price: 59.99, location: 'Regał A2' },
        { name: 'Filtr kabinowy', sku: 'FLT-TEST-002', brand: 'Bosch', stock: 6, min: 2, price: 49.99, location: 'Regał A3' },
        { name: 'Płyn hamulcowy DOT4', sku: 'FLD-TEST-001', brand: 'ATE', stock: 3, min: 2, price: 29.99, location: 'Regał C1' },
        { name: 'Płyn chłodniczy', sku: 'FLD-TEST-002', brand: 'K2', stock: 5, min: 2, price: 34.99, location: 'Regał C2' },
        { name: 'Świece zapłonowe', sku: 'IGN-TEST-001', brand: 'NGK', stock: 10, min: 4, price: 39.99, location: 'Regał D1' },
        { name: 'Akumulator 74Ah', sku: 'BAT-TEST-001', brand: 'Varta', stock: 1, min: 2, price: 449.99, location: 'Regał E1' },
        { name: 'Pasek wielorowkowy', sku: 'BLT-TEST-001', brand: 'Conti', stock: 2, min: 2, price: 89.99, location: 'Regał D2' },
        { name: 'Wycieraczki komplet', sku: 'WIP-TEST-001', brand: 'Bosch', stock: 7, min: 3, price: 79.99, location: 'Regał A4' },
      ];

      for (const p of extraParts) {
        await run(
          `INSERT INTO parts (name, sku, brand, stock, min_stock, price, location)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.name, p.sku, p.brand, p.stock, p.min, p.price, p.location]
        );
      }
      console.log("✅ Uzupełniono magazyn (parts)");
    } else {
      console.log("ℹ️ Baza już zawiera dane — seed pominięty");
    }
    return;
  }

  console.log("🌱 Pusta baza — wykonuję seed...");

  const users = [
    { imie: "Test", nazwisko: "User", mail: "test@example.com", telefon: "123456789", rola: "user", haslo: "65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5" },
    { imie: "Admin", nazwisko: "User", mail: "admin@example.com", telefon: "987654321", rola: "admin", haslo: "4429f702260179f0611a1a0ae9d2b65869418962d5f8b0b14b9f13249dc91cb6" },
    { imie: "Recepcja", nazwisko: "Front", mail: "receptionist1@example.com", telefon: "615000001", rola: "recepcja", haslo: "ad2c4ebed67b8760284f7ad42bfc2d2b97a65e9951233b929d61599bf687101e" }
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.haslo, 10);
    await run(
      `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [u.imie, u.nazwisko, u.mail, u.telefon, u.rola, hashed]
    );
    const originalPassword = u.mail === "test@example.com" ? "Test1234" : "@Admin123";
    console.log(`✅ Created user: ${u.mail} (password: ${originalPassword})`);
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
      null,
      testUser?.id ?? admin?.id ?? null
    ]
  );


  const order = await get<IdRow>(`SELECT id FROM orders ORDER BY id DESC LIMIT 1`);
  const orderId = order?.id ?? null;


  await run(
    `INSERT INTO appointments (title, start_at, end_at, status, customer_id, vehicle_id, order_id, notes)
     VALUES (?, datetime('now','+1 day'), datetime('now','+1 day','+1 hour'), 'oczekujacy', ?, ?, ?, ?)`,
    ["Wizyta serwisowa", customerId, vehicleId, orderId, "Przyjechać 10 minut wcześniej"]
  );


  await run(
    `INSERT INTO parts (name, sku, brand, stock, min_stock, price, location)
     VALUES
      ('Filtr oleju', 'FO-TEST-001', 'Bosch', 5, 2, 39.99, 'Regał A1'),
      ('Olej silnikowy 5W30', 'OIL-TEST-001', 'Castrol', 1, 3, 199.99, 'Magazyn główny')`
  );

  const extraParts = [
    { name: 'Klocki hamulcowe przód', sku: 'BRK-TEST-001', brand: 'ATE', stock: 4, min: 2, price: 249.99, location: 'Regał B2' },
    { name: 'Tarcze hamulcowe przód', sku: 'BRK-TEST-002', brand: 'Zimmermann', stock: 2, min: 2, price: 399.99, location: 'Regał B3' },
    { name: 'Filtr powietrza', sku: 'FLT-TEST-001', brand: 'Hengst', stock: 8, min: 2, price: 59.99, location: 'Regał A2' },
    { name: 'Filtr kabinowy', sku: 'FLT-TEST-002', brand: 'Bosch', stock: 6, min: 2, price: 49.99, location: 'Regał A3' },
    { name: 'Płyn hamulcowy DOT4', sku: 'FLD-TEST-001', brand: 'ATE', stock: 3, min: 2, price: 29.99, location: 'Regał C1' },
    { name: 'Płyn chłodniczy', sku: 'FLD-TEST-002', brand: 'K2', stock: 5, min: 2, price: 34.99, location: 'Regał C2' },
    { name: 'Świece zapłonowe', sku: 'IGN-TEST-001', brand: 'NGK', stock: 10, min: 4, price: 39.99, location: 'Regał D1' },
    { name: 'Akumulator 74Ah', sku: 'BAT-TEST-001', brand: 'Varta', stock: 1, min: 2, price: 449.99, location: 'Regał E1' },
    { name: 'Pasek wielorowkowy', sku: 'BLT-TEST-001', brand: 'Conti', stock: 2, min: 2, price: 89.99, location: 'Regał D2' },
    { name: 'Wycieraczki komplet', sku: 'WIP-TEST-001', brand: 'Bosch', stock: 7, min: 3, price: 79.99, location: 'Regał A4' },
  ];

  for (const p of extraParts) {
    await run(
      `INSERT INTO parts (name, sku, brand, stock, min_stock, price, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.sku, p.brand, p.stock, p.min, p.price, p.location]
    );
  }


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


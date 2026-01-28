import bcrypt from "bcrypt";
import { run, get, all } from "./db.js";
import { initDb } from "./dbInit.js";

type IdRow = { id: number };

async function main() {
  console.log("đźŚ± Seeding database (50 per table)...");
  await initDb();

  // ===== CLEAR (kolejnoĹ›Ä‡ waĹĽna przez FK) =====
  await run(`DELETE FROM messages`);
  await run(`DELETE FROM message_threads`);
  await run(`DELETE FROM notifications`);
  await run(`DELETE FROM invoices`);
  await run(`DELETE FROM appointments`);
  await run(`DELETE FROM orders`);
  await run(`DELETE FROM vehicles`);
  await run(`DELETE FROM customers`);
  await run(`DELETE FROM users`);

  // ===== USERS (1 admin + 49 users + 10 mechanics + 10 managers + 10 receptionists = 80) =====
  const users = [
    { imie: "Admin", nazwisko: "Serwis", mail: "admin@example.com", telefon: "500000001", rola: "admin", haslo: "admin123" }
  ];

  // Generuj 49 uĹĽytkownikĂłw (klienci)
  const firstNames = ["Jan", "Ala", "Kamil", "Ola", "Piotr", "Marek", "Katarzyna", "Ewa", "Tomasz", "Anna"];
  const lastNames = ["Kowalski", "Nowak", "WĂłjcik", "ZieliĹ„ska", "Lewandowski", "WiĹ›niewski", "KamiĹ„ska", "Kucharski", "GĂłrski", "MrĂłwka"];

  for (let i = 1; i <= 49; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    users.push({
      imie: `${firstName}${i}`,
      nazwisko: lastName,
      mail: `user${i}@example.com`,
      telefon: `500000${String(i + 1).padStart(3, "0")}`,
      rola: "user",
      haslo: "pass123"
    });
  }

  // Dodaj 10 mechanikĂłw
  for (let i = 1; i <= 10; i++) {
    users.push({
      imie: `Mechanik${i}`,
      nazwisko: "Nowak",
      mail: `mechanic${i}@example.com`,
      telefon: `600000${String(i).padStart(3, "0")}`,
      rola: "mechanic",
      haslo: "mech123"
    });
  }

  // Dodaj 10 kierownikĂłw
  for (let i = 1; i <= 10; i++) {
    users.push({
      imie: `Kierownik${i}`,
      nazwisko: "Manager",
      mail: `manager${i}@example.com`,
      telefon: `610000${String(i).padStart(3, "0")}`,
      rola: "manager",
      haslo: "mgr123"
    });
  }

  // Dodaj 10 recepcionistek
  for (let i = 1; i <= 10; i++) {
    users.push({
      imie: `Recepcjonistka${i}`,
      nazwisko: "Recepcja",
      mail: `receptionist${i}@example.com`,
      telefon: `620000${String(i).padStart(3, "0")}`,
      rola: "receptionist",
      haslo: "rec123"
    });
  }

  for (const u of users) {
    const hashed = await bcrypt.hash(u.haslo, 10);
    await run(
      `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [u.imie, u.nazwisko, u.mail, u.telefon, u.rola, hashed]
    );
  }
  console.log(`âś… Users: ${users.length}`);

  const admin = await get<IdRow>(`SELECT id FROM users WHERE mail = ?`, ["admin@example.com"]);
  
  // Pobierz kilku mechanikami i recepcionistek
  const allMechanics = await all<IdRow>(`SELECT id FROM users WHERE rola IN ('mechanic', 'user') LIMIT 20`);
  const mechanics = allMechanics.map(m => m.id);

  // ===== CUSTOMERS (50) =====
  const customerNames = ["Adam Nowak", "Marek WiĹ›niewski", "Katarzyna Lewandowska", "Piotr ZieliĹ„ski", "Ewa KamiĹ„ska"];
  const customerEmails = ["adam", "marek", "kasia", "piotr", "ewa"];
  
  for (let i = 1; i <= 50; i++) {
    const nameBase = customerNames[i % customerNames.length];
    const emailBase = customerEmails[i % customerEmails.length];
    const customer = {
      name: `${nameBase} ${i}`,
      email: `${emailBase}${i}@client.pl`,
      phone: `600700${String(800 + i).padStart(3, "0")}`,
      notes: `Klient nr ${i}`
    };
    await run(
      `INSERT INTO customers (name, email, phone, notes)
       VALUES (?, ?, ?, ?)`,
      [customer.name, customer.email, customer.phone, customer.notes]
    );
  }
  console.log("âś… Customers: 50");

  // Pobierz wszystkich klientĂłw
  const allCustomers = await all<IdRow>(`SELECT id FROM customers ORDER BY id ASC`);
  
  // ===== ASSIGN CUSTOMER_ID TO USER ROLES =====
  const userRows = await all<IdRow>(`SELECT id FROM users WHERE rola = 'user' ORDER BY id ASC`);
  
  for (let i = 0; i < userRows.length && i < allCustomers.length; i++) {
    await run(`UPDATE users SET customer_id = ? WHERE id = ?`, [allCustomers[i].id, userRows[i].id]);
  }
  console.log(`âś… Users assigned to customers (${Math.min(userRows.length, allCustomers.length)} mappings)`);

  // ===== VEHICLES (50) =====
  const vehicleMakes = ["Toyota", "Volkswagen", "Ford", "BMW", "Audi", "Mercedes", "Honda", "Skoda", "Renault", "Peugeot"];
  const vehicleModels = ["Corolla", "Golf", "Transit", "3", "A4", "C-Class", "Civic", "Octavia", "Clio", "308"];
  
  for (let i = 1; i <= 50; i++) {
    const make = vehicleMakes[i % vehicleMakes.length];
    const model = vehicleModels[i % vehicleModels.length];
    const customer = allCustomers[i % allCustomers.length];
    
    await run(
      `INSERT INTO vehicles (customer_id, make, model, year, plate, vin)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        make,
        model,
        2015 + (i % 10),
        `POL${String(1000 + i).padStart(4, "0")}`,
        `VIN${String(i).padStart(14, "0")}`
      ]
    );
  }
  console.log("âś… Vehicles: 50");

  const allVehicles = await all<{ id: number; customer_id: number }>(
    `SELECT id, customer_id FROM vehicles ORDER BY id ASC`
  );

  // ===== ORDERS (50) =====
  const orderServices = [
    "Wymiana oleju i filtrĂłw",
    "Diagnostyka (check engine)",
    "Klocki + tarcze przĂłd",
    "Wymiana akumulatora",
    "Serwis klimatyzacji",
    "Wymiana Ĺ›wiec zapĹ‚onowych",
    "PrzeglÄ…d techniczny",
    "Naprawa zawieszenia",
    "Wymiana klockĂłw hamulcowych"
  ];
  const statuses = ["nowe", "w_trakcie", "zakonczone"];

  for (let i = 0; i < 50; i++) {
    const vehicle = allVehicles[i % allVehicles.length];
    const customer = allCustomers[i % allCustomers.length];
    const service = orderServices[i % orderServices.length];
    const status = statuses[i % statuses.length];
    const mechanic = mechanics[i % mechanics.length];

    await run(
      `INSERT INTO orders
        (service, status, opis, customer_id, vehicle_id, mechanic_user_id, created_by_user_id, start_at, end_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        service,
        status,
        `${service} - porzÄ…dek nr ${i + 1}`,
        customer.id,
        vehicle.id,
        mechanic,
        admin!.id,
        `2025-12-${String((i % 30) + 1).padStart(2, "0")} ${String(9 + (i % 8)).padStart(2, "0")}:00`,
        status === "zakonczone" ? `2025-12-${String((i % 30) + 1).padStart(2, "0")} ${String(10 + (i % 8)).padStart(2, "0")}:30` : null
      ]
    );
  }
  console.log("âś… Orders: 50");

  const allOrders = await all<{ id: number; customer_id: number; vehicle_id: number }>(
    `SELECT id, customer_id, vehicle_id FROM orders ORDER BY id ASC`
  );

  // ===== APPOINTMENTS (50) =====
  const appointmentStatuses = ["zaplanowana", "zakonczona", "anulowana"];

  for (let i = 0; i < 50; i++) {
    const order = allOrders[i % allOrders.length];
    const status = appointmentStatuses[i % appointmentStatuses.length];
    const day = (i % 28) + 1;

    await run(
      `INSERT INTO appointments (title, start_at, end_at, status, customer_id, vehicle_id, order_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `Wizyta ${i + 1}: ${order.id}`,
        `2025-12-${String(day).padStart(2, "0")} ${String(9 + (i % 8)).padStart(2, "0")}:00`,
        `2025-12-${String(day).padStart(2, "0")} ${String(10 + (i % 8)).padStart(2, "0")}:30`,
        status,
        order.customer_id,
        order.vehicle_id,
        order.id,
        `Wizyta nr ${i + 1} - notatka`
      ]
    );
  }
  console.log("âś… Appointments: 50");

  // ===== PARTS (50) =====
  const partNames = [
    "Filtr oleju", "Olej silnikowy 5W30", "Klocki hamulcowe przĂłd", "Tarcze hamulcowe przĂłd",
    "Akumulator 74Ah", "Ĺšwieca zapĹ‚onowa", "Filtr powietrza", "Filtr salonu", "PĹ‚yn chĹ‚odniczy",
    "Pasek rozrzÄ…du", "Tarcza sprzÄ™gĹ‚a", "Komplet uszczelniacz", "PĹ‚yn hamulcowy"
  ];
  const brands = ["Bosch", "Castrol", "ATE", "Zimmermann", "Varta", "NGK", "Hengst", "Brembo"];

  for (let i = 1; i <= 50; i++) {
    const part = partNames[i % partNames.length];
    const brand = brands[i % brands.length];
    
    await run(
      `INSERT INTO parts (name, sku, brand, stock, min_stock, price, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `${part} ${i}`,
        `PART-${String(i).padStart(6, "0")}`,
        brand,
        Math.floor(Math.random() * 20),
        2,
        Math.round((50 + Math.random() * 450) * 100) / 100,
        `RegaĹ‚ ${String.fromCharCode(65 + (i % 5))}${(i % 10) + 1}`
      ]
    );
  }
  console.log("âś… Parts: 50");

  // ===== INVOICES (50) =====
  for (let i = 0; i < 50; i++) {
    const order = allOrders[i % allOrders.length];
    const invoiceStatuses = ["oczekuje", "zaplacona", "anulowana"];
    const status = invoiceStatuses[i % invoiceStatuses.length];
    const day = (i % 28) + 1;

    await run(
      `INSERT INTO invoices (number, customer_id, order_id, issue_date, due_date, amount, status, pdf_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `FV/2025/${String(i + 1).padStart(3, "0")}`,
        order.customer_id,
        order.id,
        `2025-12-${String(day).padStart(2, "0")}`,
        `2025-12-${String((day + 13) % 28 + 1).padStart(2, "0")}`,
        Math.round((100 + Math.random() * 1500) * 100) / 100,
        status,
        null
      ]
    );
  }
  console.log("âś… Invoices: 50");

  // ===== MESSAGE THREADS (50) =====
  for (let i = 0; i < 50; i++) {
    const order = allOrders[i % allOrders.length];
    const thread = {
      title: `Konwersacja ${i + 1}: Order ${order.id}`,
      customer_id: order.customer_id,
      order_id: order.id,
      created_by_user_id: admin!.id
    };
    
    await run(
      `INSERT INTO message_threads (title, customer_id, order_id, created_by_user_id, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [thread.title, thread.customer_id, thread.order_id, thread.created_by_user_id]
    );
  }
  console.log("âś… Threads: 50");

  const allThreads = await all<{ id: number }>(
    `SELECT id FROM message_threads ORDER BY id ASC`
  );

  // ===== MESSAGES (50) =====
  const messageTexts = [
    "DzieĹ„ dobry, zaczynamy serwis.",
    "Jakie sÄ… problemy z pojazdem?",
    "Wymieniamy czÄ™Ĺ›ci, proszÄ™ czekaÄ‡.",
    "Diagnostyka wykazaĹ‚a...",
    "Wszystko gotowe, proszÄ™ przyjechaÄ‡.",
    "Pytanie dot. serwisu?",
    "Potwierdzam termin wizyty.",
    "ProszÄ™ o informacjÄ™ o postÄ™pie.",
    "Czy jest moĹĽliwoĹ›Ä‡ szybszego terminu?",
    "Faktura wysĹ‚ana na maila."
  ];

  for (let i = 0; i < 50; i++) {
    const thread = allThreads[i % allThreads.length];
    const mechanic = mechanics[i % mechanics.length];
    const message = messageTexts[i % messageTexts.length];

    await run(
      `INSERT INTO messages (thread_id, sender_user_id, sender_customer_id, text)
       VALUES (?, ?, ?, ?)`,
      [thread.id, mechanic, null, `${message} (msg ${i + 1})`]
    );
    
    await run(`UPDATE message_threads SET updated_at = datetime('now') WHERE id = ?`, [thread.id]);
  }
  console.log("âś… Messages: 50");

  // ===== NOTIFICATIONS (50) =====
  const notificationTitles = [
    "Panel admin",
    "Nowe zlecenie",
    "Diagnostyka",
    "Magazyn",
    "Faktury",
    "WiadomoĹ›Ä‡",
    "Wizyta",
    "Status"
  ];

  const notifUsers = await all<{ id: number }>(
    `SELECT id FROM users ORDER BY id ASC LIMIT 50`
  );

  for (let i = 0; i < Math.min(50, notifUsers.length); i++) {
    const title = notificationTitles[i % notificationTitles.length];
    
    await run(
      `INSERT INTO notifications (user_id, title, body)
       VALUES (?, ?, ?)`,
      [
        notifUsers[i].id,
        title,
        `Powiadomienie ${i + 1}: ${title} - nowa wiadomoĹ›Ä‡ do przeczytania.`
      ]
    );
  }
  console.log("âś… Notifications: 50");

  // ===== 1. PART CATEGORIES (10) =====
  const categories = [
    "Hamulce", "Filtry", "Oleje", "Zawieszenie", "Silnik", 
    "Klimatyzacja", "Elektryka", "OĹ›wietlenie", "Paliwo", "Inne"
  ];

  for (const cat of categories) {
    await run(
      `INSERT INTO part_categories (name, description)
       VALUES (?, ?)`,
      [cat, `Kategoria czÄ™Ĺ›ci: ${cat}`]
    );
  }
  console.log("âś… Part Categories: 10");

  const allCategories = await all<IdRow>(`SELECT id FROM part_categories ORDER BY id ASC`);

  // ===== 2. SERVICE PRICES (10) =====
  const services = [
    { name: "Wymiana oleju", price: 150, hours: 1 },
    { name: "Diagnostyka", price: 80, hours: 1 },
    { name: "Wymiana klockĂłw", price: 350, hours: 2 },
    { name: "Wymiana tarcz", price: 400, hours: 2.5 },
    { name: "Wymiana akumulatora", price: 200, hours: 1 },
    { name: "PrzeglÄ…d techniczny", price: 250, hours: 2 },
    { name: "Serwis klimatyzacji", price: 300, hours: 2 },
    { name: "Wymiana Ĺ›wiec", price: 120, hours: 1 },
    { name: "Naprawa zawieszenia", price: 500, hours: 4 },
    { name: "Wymiana filtra powietrza", price: 80, hours: 0.5 }
  ];

  for (const svc of services) {
    await run(
      `INSERT INTO service_prices (name, description, base_price, labor_hours, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [svc.name, `UsĹ‚uga: ${svc.name}`, svc.price, svc.hours, 1]
    );
  }
  console.log("âś… Service Prices: 10");

  // ===== 3. VEHICLE HISTORY (50) =====
  for (let i = 0; i < 50; i++) {
    const vehicle = allVehicles[i % allVehicles.length];
    const mechanic = mechanics[i % mechanics.length];
    const day = (i % 28) + 1;

    await run(
      `INSERT INTO vehicle_history (vehicle_id, service_type, description, date_performed, mechanic_user_id, cost, parts_used, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle.id,
        services[i % services.length].name,
        `Historia serwisu nr ${i + 1}`,
        `2025-12-${String(day).padStart(2, "0")}`,
        mechanic,
        Math.round((80 + Math.random() * 500) * 100) / 100,
        `CzÄ™Ĺ›Ä‡ ${i + 1}`,
        `Notatka serwisowa nr ${i + 1}`
      ]
    );
  }
  console.log("âś… Vehicle History: 50");

  // ===== 4. EMPLOYEE SCHEDULE (50) =====
  const daysOfWeek = ["PoniedziaĹ‚ek", "Wtorek", "Ĺšroda", "Czwartek", "PiÄ…tek", "Sobota", "Niedziela"];

  for (let i = 0; i < 50; i++) {
    const user = userRows[i % userRows.length];
    const day = daysOfWeek[i % daysOfWeek.length];
    const isAvailable = i % 7 !== 6 ? 1 : 0; // Niedziela niedostÄ™pna

    await run(
      `INSERT INTO employee_schedule (user_id, day_of_week, start_time, end_time, is_available)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.id,
        day,
        `${String(8 + (i % 4)).padStart(2, "0")}:00`,
        `${String(16 + (i % 4)).padStart(2, "0")}:00`,
        isAvailable
      ]
    );
  }
  console.log("âś… Employee Schedule: 50");

  // ===== 5. SUPPLIERS (15) =====
  const supplierNames = [
    "Auto Parts Sp. z o.o.", "CzÄ™Ĺ›ci Samochodowe Plus", "Serwis Import",
    "SupplyCar Polska", "Mechanic Store", "Auto Express", "Parts World",
    "Spare Parts Depot", "Car Components Ltd", "Premium Parts Center",
    "Logistics Auto", "Quality Spares", "Direct Parts Supply", "Wholesale Motors", "Trade Auto Parts"
  ];

  for (let i = 0; i < 15; i++) {
    const supplier = supplierNames[i];
    
    await run(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, city, postal_code, payment_terms, rating, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplier,
        `Osoba${i + 1}`,
        `contact${i + 1}@supplier.com`,
        `+48${String(600000000 + i * 1000000).padStart(9, "0")}`,
        `Ulica ${i + 1}`,
        ["Warszawa", "KrakĂłw", "PoznaĹ„", "WrocĹ‚aw", "GdaĹ„sk"][i % 5],
        `${String(30000 + i * 100).padStart(5, "0")}`,
        "30 dni",
        Math.round((3 + Math.random() * 2) * 10) / 10,
        1
      ]
    );
  }
  console.log("âś… Suppliers: 15");

  // ===== 6. RATINGS (50) =====
  for (let i = 0; i < 50; i++) {
    const customer = allCustomers[i % allCustomers.length];
    const mechanic = mechanics[i % mechanics.length];
    const order = allOrders[i % allOrders.length];

    await run(
      `INSERT INTO ratings (customer_id, mechanic_user_id, order_id, rating_score, comment, is_anonymous)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        mechanic,
        order.id,
        Math.floor(3 + Math.random() * 3), // 3-5 gwiazdek
        `Opinia klienta nr ${i + 1}: Dobra robota, profesjonalny serwis`,
        i % 10 === 0 ? 1 : 0
      ]
    );
  }
  console.log("âś… Ratings: 50");

  // ===== 7. EMAIL TEMPLATES (6) =====
  const emailTemplates = [
    {
      name: "Potwierdzenie rezerwacji",
      subject: "Potwierdzenie Twojej wizyty",
      type: "appointment_confirmation",
      body: "CzeĹ›Ä‡ {customer_name},\n\nTwoja wizyta zostaĹ‚a potwierdzona na dzieĹ„ {date} o godzinie {time}.\n\nPozdrawiamy,\nSerwis AutoRepair"
    },
    {
      name: "Faktury wysĹ‚ane",
      subject: "Twoja faktura nr {invoice_number}",
      type: "invoice_sent",
      body: "Szanowny Panie/Pani,\n\nW zaĹ‚Ä…czniku wysyĹ‚amy Pani(u) fakturÄ™ na kwotÄ™ {amount} zĹ‚.\n\nPozdrawiamy,\nAutoRepair"
    },
    {
      name: "Zlecenie gotowe",
      subject: "Twoje zlecenie jest gotowe",
      type: "order_ready",
      body: "CzeĹ›Ä‡ {customer_name},\n\nTwĂłj pojazd {vehicle} jest gotowy do odbioru!\n\nPozdrawiamy,\nAutoRepair"
    },
    {
      name: "Przypomnienie wizyty",
      subject: "Przypomnij sobie o zaplanowanej wizycie",
      type: "appointment_reminder",
      body: "CzeĹ›Ä‡ {customer_name},\n\nPamiÄ™taj o wizycie jutro o godzinie {time}!\n\nPozdrawiamy,\nAutoRepair"
    },
    {
      name: "WiadomoĹ›Ä‡ od serwisu",
      subject: "WiadomoĹ›Ä‡ od serwisu AutoRepair",
      type: "service_message",
      body: "{message}"
    },
    {
      name: "Nowy mechanik",
      subject: "Witaj w zespole AutoRepair",
      type: "welcome_employee",
      body: "CzeĹ›Ä‡ {employee_name},\n\nWitamy CiÄ™ w naszym zespole!\n\nPozdrawiamy,\nZarzÄ…d"
    }
  ];

  for (const tpl of emailTemplates) {
    await run(
      `INSERT INTO email_templates (name, subject, body, template_type, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [tpl.name, tpl.subject, tpl.body, tpl.type, 1]
    );
  }
  console.log("âś… Email Templates: 6");

  // ===== 8. ANALYTICS (30 dni) =====
  for (let i = 0; i < 30; i++) {
    const day = (i % 28) + 1;
    const topMechanic = mechanics[i % mechanics.length];

    await run(
      `INSERT INTO analytics (date, total_revenue, total_orders, total_appointments, completed_orders, average_rating, top_service, top_mechanic_id, new_customers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `2025-12-${String(day).padStart(2, "0")}`,
        Math.round((5000 + Math.random() * 15000) * 100) / 100,
        Math.floor(10 + Math.random() * 20),
        Math.floor(5 + Math.random() * 10),
        Math.floor(8 + Math.random() * 10),
        Math.round((4 + Math.random() * 1) * 10) / 10,
        services[i % services.length].name,
        topMechanic,
        Math.floor(Math.random() * 5)
      ]
    );
  }
  console.log("âś… Analytics: 30");

  console.log("âś¨ Database seeded successfully (50 per table)!");
}

main().catch((e) => {
  console.error("âťŚ Seed failed:", e);
  process.exit(1);
});


import bcrypt from "bcrypt";
import { run, get, all } from "./db.js";
import { initDb } from "./dbInit.js";

type IdRow = { id: number };

async function main() {
  console.log("🌱 Rebuilding database with optimized seed...");
  await initDb();

  await run(`DELETE FROM messages`);
  await run(`DELETE FROM message_threads`);
  await run(`DELETE FROM notifications`);
  await run(`DELETE FROM invoices`);
  await run(`DELETE FROM appointments`);
  await run(`DELETE FROM orders`);
  await run(`DELETE FROM ratings`);
  await run(`DELETE FROM vehicle_history`);
  await run(`DELETE FROM vehicles`);
  await run(`DELETE FROM customers`);
  await run(`DELETE FROM users`);
  await run(`DELETE FROM employee_schedule`);
  await run(`DELETE FROM parts`);
  await run(`DELETE FROM part_categories`);
  await run(`DELETE FROM service_prices`);
  await run(`DELETE FROM suppliers`);
  await run(`DELETE FROM analytics`);
  await run(`DELETE FROM email_templates`);

  console.log("📋 Creating 50 customers...");
  const customerNames = [
    "Adam Nowak", "Marek Wiśniewski", "Katarzyna Lewandowska", "Piotr Zieliński", "Ewa Kamińska",
    "Robert Górski", "Anna Kucharska", "Tomasz Marciniak", "Barbara Kowalczyk", "Stanisław Wójcik"
  ];

  for (let i = 1; i <= 50; i++) {
    const nameBase = customerNames[(i - 1) % customerNames.length];
    await run(
      `INSERT INTO customers (name, email, phone, notes)
       VALUES (?, ?, ?, ?)`,
      [
        `${nameBase} ${i}`,
        `customer${i}@client.pl`,
        `600700${String(800 + i).padStart(3, "0")}`,
        `Klient nr ${i}`
      ]
    );
  }
  const allCustomers = await all<IdRow>(`SELECT id FROM customers ORDER BY id ASC`);
  console.log("✅ Customers: 50 created");

  console.log("👤 Creating users...");

  const adminHash = "4429f702260179f0611a1a0ae9d2b65869418962d5f8b0b14b9f13249dc91cb6";
  await run(
    `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo, customer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ["Admin", "Serwis", "admin@example.com", "500000001", "admin", await bcrypt.hash(adminHash, 10), null]
  );

  const admin = await get<IdRow>(`SELECT id FROM users WHERE mail = ?`, ["admin@example.com"]);

  const userHash = "d3dec3f35387156495cbc21471313f87155f878f3435b693f50077c2be479033";
  const bcryptUserHash = await bcrypt.hash(userHash, 10);
  
  const firstNames = ["Jan", "Ala", "Kamil", "Ola", "Piotr", "Marek", "Katarzyna", "Ewa", "Tomasz", "Anna"];
  const lastNames = ["Kowalski", "Nowak", "Wójcik", "Zielińska", "Lewandowski", "Wiśniewski", "Kamińska", "Kucharski", "Górski", "Mrówka"];

  for (let i = 1; i <= 40; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    await run(
      `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `${firstName}${i}`,
        lastName,
        `user${i}@example.com`,
        `500000${String(i).padStart(3, "0")}`,
        "user",
        bcryptUserHash,
        allCustomers[i - 1].id
      ]
    );
  }
  console.log("✅ Regular users: 40 created and mapped to customers 1-40");

  const mechHash = "7c756054f305a9ecff1b8cae83f8ee0b03045ecf8854e342b57be0f101fa7137";
  const bcryptMechHash = await bcrypt.hash(mechHash, 10);
  
  for (let i = 1; i <= 10; i++) {
    await run(
      `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `Mechanik${i}`,
        "Nowak",
        `mechanic${i}@example.com`,
        `600000${String(i).padStart(3, "0")}`,
        "mechanik",
        bcryptMechHash,
        null
      ]
    );
  }
  console.log("✅ Mechanics: 10 created");

  const mgrHash = "c39557b239d65f89a795be351873297c71300a162b1f4d2546ea3d9c29883736";
  const bcryptMgrHash = await bcrypt.hash(mgrHash, 10);
  
  for (let i = 1; i <= 10; i++) {
    await run(
      `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `Kierownik${i}`,
        "Manager",
        `manager${i}@example.com`,
        `610000${String(i).padStart(3, "0")}`,
        "kierownik",
        bcryptMgrHash,
        null
      ]
    );
  }
  console.log("✅ Managers: 10 created");

  const receptionistHash = "ad2c4ebed67b8760284f7ad42bfc2d2b97a65e9951233b929d61599bf687101e";
  const bcryptReceptionistHash = await bcrypt.hash(receptionistHash, 10);

  for (let i = 1; i <= 5; i++) {
    await run(
      `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `Recepcja${i}`,
        "Front",
        `receptionist${i}@example.com`,
        `615000${String(i).padStart(3, "0")}`,
        "recepcja",
        bcryptReceptionistHash,
        null
      ]
    );
  }
  console.log("✅ Receptionists: 5 created");

  const clientHash = "7667e9ec55bddbf87fdfb74fc3144dbbe6631f947556d863dece951aac93b0e6";
  const bcryptClientHash = await bcrypt.hash(clientHash, 10);
  
  for (let i = 1; i <= 10; i++) {
    await run(
      `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `Klient${i}`,
        "Serwisu",
        `client${i}@example.com`,
        `620000${String(i).padStart(3, "0")}`,
        "klient",
        bcryptClientHash,
        allCustomers[39 + i].id
      ]
    );
  }
  console.log("✅ Clients: 10 created and mapped to customers 41-50");

  const allUsers = await all<IdRow>(`SELECT id FROM users ORDER BY id ASC`);
  const allMechanics = await all<IdRow>(`SELECT id FROM users WHERE rola = 'mechanik' ORDER BY id ASC`);
  const mechanicIds = allMechanics.map(m => m.id);

  console.log("🚗 Creating 50 vehicles...");
  const vehicleMakes = ["Toyota", "Volkswagen", "Ford", "BMW", "Audi", "Mercedes", "Honda", "Skoda", "Renault", "Peugeot"];
  const vehicleModels = ["Corolla", "Golf", "Transit", "3", "A4", "C-Class", "Civic", "Octavia", "Clio", "308"];

  for (let i = 1; i <= 50; i++) {
    const make = vehicleMakes[(i - 1) % vehicleMakes.length];
    const model = vehicleModels[(i - 1) % vehicleModels.length];
    const customerId = allCustomers[(i - 1) % allCustomers.length].id;

    await run(
      `INSERT INTO vehicles (customer_id, make, model, year, plate, vin)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        make,
        model,
        2015 + (i % 10),
        `POL${String(1000 + i).padStart(4, "0")}`,
        `VIN${String(i).padStart(14, "0")}`
      ]
    );
  }
  const allVehicles = await all<{ id: number; customer_id: number }>(
    `SELECT id, customer_id FROM vehicles ORDER BY id ASC`
  );
  console.log("✅ Vehicles: 50 created");

  console.log("📦 Creating 50 orders...");
  const orderServices = [
    "Wymiana oleju i filtrów",
    "Diagnostyka (check engine)",
    "Klocki + tarcze przód",
    "Wymiana akumulatora",
    "Serwis klimatyzacji",
    "Wymiana świec zapłonowych",
    "Przegląd techniczny",
    "Naprawa zawieszenia",
    "Wymiana klocków hamulcowych"
  ];
  const statuses = ["nowe", "w_trakcie", "zakonczone"];

  for (let i = 1; i <= 50; i++) {
    const vehicle = allVehicles[(i - 1) % allVehicles.length];
    const service = orderServices[(i - 1) % orderServices.length];
    const status = statuses[(i - 1) % statuses.length];
    const mechanic = mechanicIds[(i - 1) % mechanicIds.length];
    const day = ((i - 1) % 28) + 1;

    await run(
      `INSERT INTO orders
        (service, status, opis, customer_id, vehicle_id, mechanic_user_id, created_by_user_id, start_at, end_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        service,
        status,
        `${service} - porządek nr ${i}`,
        vehicle.customer_id,
        vehicle.id,
        mechanic,
        admin!.id,
        `2025-12-${String(day).padStart(2, "0")} ${String(9 + ((i - 1) % 8)).padStart(2, "0")}:00`,
        status === "zakonczone" ? `2025-12-${String(day).padStart(2, "0")} ${String(10 + ((i - 1) % 8)).padStart(2, "0")}:30` : null
      ]
    );
  }
  const allOrders = await all<{ id: number; customer_id: number; vehicle_id: number }>(
    `SELECT id, customer_id, vehicle_id FROM orders ORDER BY id ASC`
  );
  console.log("✅ Orders: 50 created");
  console.log("📅 Creating 50 appointments...");
  const appointmentStatuses = ["oczekujacy", "zaakceptowany", "wykonano"];

  for (let i = 1; i <= 50; i++) {
    const order = allOrders[(i - 1) % allOrders.length];
    const status = appointmentStatuses[(i - 1) % appointmentStatuses.length];
    const day = ((i - 1) % 28) + 1;

    await run(
      `INSERT INTO appointments (title, start_at, end_at, status, customer_id, vehicle_id, order_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `Wizyta ${i}`,
        `2025-12-${String(day).padStart(2, "0")} ${String(9 + ((i - 1) % 8)).padStart(2, "0")}:00`,
        `2025-12-${String(day).padStart(2, "0")} ${String(10 + ((i - 1) % 8)).padStart(2, "0")}:30`,
        status,
        order.customer_id,
        order.vehicle_id,
        order.id,
        `Wizyta nr ${i}`
      ]
    );
  }
  console.log("✅ Appointments: 50 created");
  console.log("💰 Creating 50 invoices...");
  for (let i = 1; i <= 50; i++) {
    const order = allOrders[(i - 1) % allOrders.length];
    const invoiceStatuses = ["oczekuje", "zaplacona", "anulowana"];
    const status = invoiceStatuses[(i - 1) % invoiceStatuses.length];
    const day = ((i - 1) % 28) + 1;

    await run(
      `INSERT INTO invoices (number, customer_id, order_id, issue_date, due_date, amount, status, pdf_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `FV/2025/${String(i).padStart(3, "0")}`,
        order.customer_id,
        order.id,
        `2025-12-${String(day).padStart(2, "0")}`,
        `2025-12-${String(((day + 13) % 28) + 1).padStart(2, "0")}`,
        Math.round((100 + Math.random() * 1500) * 100) / 100,
        status,
        null
      ]
    );
  }
  console.log("✅ Invoices: 50 created");
  console.log("💬 Creating 50 message threads...");
  for (let i = 1; i <= 50; i++) {
    const order = allOrders[(i - 1) % allOrders.length];

    await run(
      `INSERT INTO message_threads (title, customer_id, order_id, created_by_user_id, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [
        `Konwersacja ${i}: Order ${order.id}`,
        order.customer_id,
        order.id,
        admin!.id
      ]
    );
  }

  const allThreads = await all<{ id: number }>(
    `SELECT id FROM message_threads ORDER BY id ASC`
  );

  const messageTexts = [
    "Dzień dobry, zaczynamy serwis.",
    "Jakie są problemy z pojazdem?",
    "Wymieniamy części, proszę czekać.",
    "Diagnostyka wykazała...",
    "Wszystko gotowe, proszę przyjechać.",
    "Pytanie dot. serwisu?",
    "Potwierdzam termin wizyty.",
    "Proszę o informację o postępie.",
    "Czy jest możliwość szybszego terminu?",
    "Faktura wysłana na maila."
  ];

  for (let i = 1; i <= 50; i++) {
    const thread = allThreads[(i - 1) % allThreads.length];
    const mechanic = mechanicIds[(i - 1) % mechanicIds.length];
    const message = messageTexts[(i - 1) % messageTexts.length];

    await run(
      `INSERT INTO messages (thread_id, sender_user_id, sender_customer_id, text)
       VALUES (?, ?, ?, ?)`,
      [thread.id, mechanic, null, `${message} (msg ${i})`]
    );

    await run(`UPDATE message_threads SET updated_at = datetime('now') WHERE id = ?`, [thread.id]);
  }
  console.log("✅ Message threads: 50, Messages: 50 created");
  console.log("📦 Creating 50 parts...");
  const partNames = [
    "Filtr oleju", "Olej silnikowy 5W30", "Klocki hamulcowe przód", "Tarcze hamulcowe przód",
    "Akumulator 74Ah", "Świeca zapłonowa", "Filtr powietrza", "Filtr salonu", "Płyn chłodniczy",
    "Pasek rozrządu", "Tarcza sprzęgła", "Komplet uszczelniacz", "Płyn hamulcowy"
  ];
  const brands = ["Bosch", "Castrol", "ATE", "Zimmermann", "Varta", "NGK", "Hengst", "Brembo"];

  for (let i = 1; i <= 50; i++) {
    const part = partNames[(i - 1) % partNames.length];
    const brand = brands[(i - 1) % brands.length];

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
        `Regał ${String.fromCharCode(65 + ((i - 1) % 5))}${((i - 1) % 10) + 1}`
      ]
    );
  }
  console.log("✅ Parts: 50 created");
  console.log("📂 Creating part categories...");
  const categories = [
    "Hamulce", "Filtry", "Oleje", "Zawieszenie", "Silnik",
    "Klimatyzacja", "Elektryka", "Oświetlenie", "Paliwo", "Inne"
  ];

  for (const cat of categories) {
    await run(
      `INSERT INTO part_categories (name, description)
       VALUES (?, ?)`,
      [cat, `Kategoria części: ${cat}`]
    );
  }
  console.log("✅ Part categories: 10 created");
  console.log("💵 Creating service prices...");
  const services = [
    { name: "Wymiana oleju", price: 150, hours: 1 },
    { name: "Diagnostyka", price: 80, hours: 1 },
    { name: "Wymiana klocków", price: 350, hours: 2 },
    { name: "Wymiana tarcz", price: 400, hours: 2.5 },
    { name: "Wymiana akumulatora", price: 200, hours: 1 },
    { name: "Przegląd techniczny", price: 250, hours: 2 },
    { name: "Serwis klimatyzacji", price: 300, hours: 2 },
    { name: "Wymiana świec", price: 120, hours: 1 },
    { name: "Naprawa zawieszenia", price: 500, hours: 4 },
    { name: "Wymiana filtra powietrza", price: 80, hours: 0.5 }
  ];

  for (const svc of services) {
    await run(
      `INSERT INTO service_prices (name, description, base_price, labor_hours, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [svc.name, `Usługa: ${svc.name}`, svc.price, svc.hours, 1]
    );
  }
  console.log("✅ Service prices: 10 created");
  console.log("🏭 Creating suppliers...");
  const supplierNames = [
    "Auto Parts Sp. z o.o.", "Części Samochodowe Plus", "Serwis Import",
    "SupplyCar Polska", "Mechanic Store", "Auto Express", "Parts World",
    "Spare Parts Depot", "Car Components Ltd", "Premium Parts Center",
    "Logistics Auto", "Quality Spares", "Direct Parts Supply", "Wholesale Motors", "Trade Auto Parts"
  ];

  for (let i = 0; i < supplierNames.length; i++) {
    const supplier = supplierNames[i];
    const cities = ["Warszawa", "Kraków", "Poznań", "Wrocław", "Gdańsk"];

    await run(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, city, postal_code, payment_terms, rating, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplier,
        `Osoba${i + 1}`,
        `contact${i + 1}@supplier.com`,
        `+48${String(600000000 + i * 1000000).padStart(9, "0")}`,
        `Ulica ${i + 1}`,
        cities[i % cities.length],
        `${String(30000 + i * 100).padStart(5, "0")}`,
        "30 dni",
        Math.round((3 + Math.random() * 2) * 10) / 10,
        1
      ]
    );
  }
  console.log("✅ Suppliers: 15 created");
  console.log("📜 Creating vehicle history...");
  for (let i = 1; i <= 50; i++) {
    const vehicle = allVehicles[(i - 1) % allVehicles.length];
    const mechanic = mechanicIds[(i - 1) % mechanicIds.length];
    const day = ((i - 1) % 28) + 1;

    await run(
      `INSERT INTO vehicle_history (vehicle_id, service_type, description, date_performed, mechanic_user_id, cost, parts_used, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle.id,
        services[(i - 1) % services.length].name,
        `Historia serwisu nr ${i}`,
        `2025-12-${String(day).padStart(2, "0")}`,
        mechanic,
        Math.round((80 + Math.random() * 500) * 100) / 100,
        `Część ${i}`,
        `Notatka serwisowa nr ${i}`
      ]
    );
  }
  console.log("✅ Vehicle history: 50 created");
  console.log("⭐ Creating ratings...");
  for (let i = 1; i <= 50; i++) {
    const customer = allCustomers[(i - 1) % allCustomers.length];
    const mechanic = mechanicIds[(i - 1) % mechanicIds.length];
    const order = allOrders[(i - 1) % allOrders.length];

    await run(
      `INSERT INTO ratings (customer_id, mechanic_user_id, order_id, rating_score, comment, is_anonymous)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        mechanic,
        order.id,
        Math.floor(3 + Math.random() * 3),
        `Opinia klienta nr ${i}: Dobra robota, profesjonalny serwis`,
        (i % 10) === 0 ? 1 : 0
      ]
    );
  }
  console.log("✅ Ratings: 50 created");
  console.log("📅 Creating employee schedule...");
  const daysOfWeek = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
  const regularUsers = await all<IdRow>(`SELECT id FROM users WHERE rola = 'user' ORDER BY id ASC`);

  for (let i = 1; i <= Math.min(50, regularUsers.length); i++) {
    const user = regularUsers[(i - 1) % regularUsers.length];
    const day = daysOfWeek[(i - 1) % daysOfWeek.length];
    const isAvailable = ((i - 1) % 7) !== 6 ? 1 : 0;

    await run(
      `INSERT INTO employee_schedule (user_id, day_of_week, start_time, end_time, is_available)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.id,
        day,
        `${String(8 + ((i - 1) % 4)).padStart(2, "0")}:00`,
        `${String(16 + ((i - 1) % 4)).padStart(2, "0")}:00`,
        isAvailable
      ]
    );
  }
  console.log("✅ Employee schedule: 50 created");
  console.log("🔔 Creating notifications...");
  const notificationTitles = [
    "Panel admin", "Nowe zlecenie", "Diagnostyka", "Magazyn",
    "Faktury", "Wiadomość", "Wizyta", "Status"
  ];

  for (let i = 0; i < Math.min(50, allUsers.length); i++) {
    const title = notificationTitles[i % notificationTitles.length];

    await run(
      `INSERT INTO notifications (user_id, title, body)
       VALUES (?, ?, ?)`,
      [
        allUsers[i].id,
        title,
        `Powiadomienie ${i + 1}: ${title} - nowa wiadomość do przeczytania.`
      ]
    );
  }
  console.log("✅ Notifications: 50 created");
  console.log("📧 Creating email templates...");
  const emailTemplates = [
    {
      name: "Potwierdzenie rezerwacji",
      subject: "Potwierdzenie Twojej wizyty",
      type: "appointment_confirmation",
      body: "Cześć {customer_name},\n\nTwoja wizyta została potwierdzona na dzień {date} o godzinie {time}.\n\nPozdrawiamy,\nSerwis AutoRepair"
    },
    {
      name: "Faktury wysłane",
      subject: "Twoja faktura nr {invoice_number}",
      type: "invoice_sent",
      body: "Szanowny Panie/Pani,\n\nW załączniku wysyłamy Pani(u) fakturę na kwotę {amount} zł.\n\nPozdrawiamy,\nAutoRepair"
    },
    {
      name: "Zlecenie gotowe",
      subject: "Twoje zlecenie jest gotowe",
      type: "order_ready",
      body: "Cześć {customer_name},\n\nTwój pojazd {vehicle} jest gotowy do odbioru!\n\nPozdrawiamy,\nAutoRepair"
    },
    {
      name: "Przypomnienie wizyty",
      subject: "Przypomnij sobie o zaplanowanej wizycie",
      type: "appointment_reminder",
      body: "Cześć {customer_name},\n\nPamiętaj o wizycie jutro o godzinie {time}!\n\nPozdrawiamy,\nAutoRepair"
    },
    {
      name: "Wiadomość od serwisu",
      subject: "Wiadomość od serwisu AutoRepair",
      type: "service_message",
      body: "{message}"
    },
    {
      name: "Nowy mechanik",
      subject: "Witaj w zespole AutoRepair",
      type: "welcome_employee",
      body: "Cześć {employee_name},\n\nWitamy Cię w naszym zespole!\n\nPozdrawiamy,\nZarząd"
    }
  ];

  for (const tpl of emailTemplates) {
    await run(
      `INSERT INTO email_templates (name, subject, body, template_type, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [tpl.name, tpl.subject, tpl.body, tpl.type, 1]
    );
  }
  console.log("✅ Email templates: 6 created");
  console.log("📊 Creating analytics...");
  for (let i = 1; i <= 30; i++) {
    const day = i;
    const topMechanic = mechanicIds[(i - 1) % mechanicIds.length];

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
        services[(i - 1) % services.length].name,
        topMechanic,
        Math.floor(Math.random() * 5)
      ]
    );
  }
  console.log("✅ Analytics: 30 created");
  console.log("\n" + "=".repeat(60));
  console.log("✨ DATABASE SEEDED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📝 Test Credentials:");
  console.log("  Admin:     admin@example.com / @Admin123");
  console.log("  User 1-40: user{i}@example.com / Pass1234");
  console.log("  Mechanic:  mechanic{i}@example.com / Mech1234");
  console.log("  Manager:   manager{i}@example.com / Mgr12345");
  console.log("  Reception: receptionist{i}@example.com / Rec12345");
  console.log("  Client 1-10: client{i}@example.com / Klient123");
  console.log("\n👥 Data Structure:");
  console.log("  • 50 Customers");
  console.log("  • 1 Admin + 40 Regular Users + 10 Mechanics + 10 Managers + 5 Receptionists + 10 Clients = 76 Users");
  console.log("  • 50 Vehicles (distributed across 50 customers)");
  console.log("  • 50 Orders (linked to vehicles & customers)");
  console.log("  • 50 Appointments");
  console.log("  • 50 Invoices");
  console.log("  • 50 Message threads with messages");
  console.log("  • 50 Parts + 10 Categories");
  console.log("  • 15 Suppliers");
  console.log("  • 50 Vehicle History records");
  console.log("  • 50 Ratings");
  console.log("  • 50 Employee Schedules");
  console.log("  • 50 Notifications");
  console.log("  • 6 Email Templates");
  console.log("  • 30 Analytics records");
  console.log("=".repeat(60) + "\n");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});

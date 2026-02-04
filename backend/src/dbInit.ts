import { run } from "./db.js";

export async function initDb() {
  await run(`PRAGMA foreign_keys = ON;`);

  await run(`DROP TABLE IF EXISTS part_categories`);
  await run(`
    CREATE TABLE IF NOT EXISTS part_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imie TEXT NOT NULL,
      nazwisko TEXT NOT NULL,
      mail TEXT NOT NULL UNIQUE,
      telefon TEXT,
      rola TEXT NOT NULL DEFAULT 'user',
      haslo TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'aktywny',
      last_login_at TEXT,
      customer_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER,
      plate TEXT NOT NULL UNIQUE,
      vin TEXT,
      last_service_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'nowe',
      opis TEXT,
      customer_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      mechanic_user_id INTEGER,
      created_by_user_id INTEGER,
      start_at TEXT,
      end_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
      FOREIGN KEY (mechanic_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT,
      status TEXT NOT NULL DEFAULT 'oczekujacy',
      customer_id INTEGER,
      vehicle_id INTEGER,
      order_id INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS part_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`DROP TABLE IF EXISTS parts`);
  await run(`
    CREATE TABLE IF NOT EXISTS parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      brand TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      location TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES part_categories(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      order_id INTEGER,
      issue_date TEXT NOT NULL,
      due_date TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'oczekuje',
      pdf_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS message_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      customer_id INTEGER,
      order_id INTEGER,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      sender_user_id INTEGER,
      sender_customer_id INTEGER,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (sender_customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_users_mail ON users(mail);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_orders_vehicle ON orders(vehicle_id);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_at);`);

  await run(`DROP TABLE IF EXISTS service_prices`);
  await run(`
    CREATE TABLE IF NOT EXISTS service_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      base_price REAL NOT NULL,
      labor_hours REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`DROP TABLE IF EXISTS vehicle_history`);
  await run(`
    CREATE TABLE IF NOT EXISTS vehicle_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      service_type TEXT NOT NULL,
      description TEXT,
      date_performed TEXT NOT NULL,
      mechanic_user_id INTEGER,
      cost REAL,
      parts_used TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
      FOREIGN KEY (mechanic_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await run(`DROP TABLE IF EXISTS employee_schedule`);
  await run(`
    CREATE TABLE IF NOT EXISTS employee_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`DROP TABLE IF EXISTS suppliers`);
  await run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      payment_terms TEXT,
      rating REAL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`DROP TABLE IF EXISTS ratings`);
  await run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      mechanic_user_id INTEGER,
      order_id INTEGER,
      rating_score INTEGER NOT NULL,
      comment TEXT,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (mechanic_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `);

  await run(`DROP TABLE IF EXISTS email_templates`);
  await run(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      template_type TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`DROP TABLE IF EXISTS analytics`);
  await run(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_revenue REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      total_appointments INTEGER DEFAULT 0,
      completed_orders INTEGER DEFAULT 0,
      average_rating REAL DEFAULT 0,
      top_service TEXT,
      top_mechanic_id INTEGER,
      new_customers INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (top_mechanic_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

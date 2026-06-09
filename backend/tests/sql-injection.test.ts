import sqlite3 from 'sqlite3';

type LoginRow = { id: number; mail: string; haslo: string };

function run(db: sqlite3.Database, sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function get<T = any>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row as T | undefined);
    });
  });
}

describe('SQL Injection - demonstracja', () => {
  let db: sqlite3.Database;

  beforeAll(async () => {
    sqlite3.verbose();
    db = new sqlite3.Database(':memory:');
    await run(db, 'CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, mail TEXT, haslo TEXT)');
    await run(db, 'INSERT INTO users (mail, haslo) VALUES (?, ?)', ['admin@example.com', 'sekret']);
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      db.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('zapytanie NIEparametryzowane jest podatne (pokaz kontrolny)', async () => {
    const injection = "' OR '1'='1";
    const sql = `SELECT id, mail, haslo FROM users WHERE mail = '${injection}'`;
    const row = await get<LoginRow>(db, sql);

    console.log('NIEBEZPIECZNE SQL:', sql);
    console.log('Wynik bypassu:', row ? 'ZNALEZIONO użytkownika (podatne)' : 'brak');

    expect(row).toBeDefined();
  });

  it('zapytanie parametryzowane blokuje SQL injection', async () => {
    const payloady = [
      "' OR '1'='1",
      "admin@example.com' --",
      "' UNION SELECT * FROM users --",
      "' OR 1=1 --",
    ];

    for (const payload of payloady) {
      const row = await get<LoginRow>(db, 'SELECT id, mail, haslo FROM users WHERE mail = ?', [payload]);
      console.log(`Payload: ${payload} -> ${row ? 'bypass ❌' : 'zablokowane ✅'}`);
      expect(row).toBeUndefined();
    }
  });

  it('poprawne dane nadal działają przy parametryzacji', async () => {
    const row = await get<LoginRow>(db, 'SELECT id, mail, haslo FROM users WHERE mail = ?', ['admin@example.com']);
    expect(row).toBeDefined();
    expect(row?.mail).toBe('admin@example.com');
  });
});

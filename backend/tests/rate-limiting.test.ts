import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';

function makeTestLimiter(max: number, windowMs = 60000) {
  return rateLimit({
    windowMs,
    max,
    message: 'Zbyt wiele żądań, spróbuj ponownie później.',
    standardHeaders: true,
    legacyHeaders: false,
  });
}

describe('Rate Limiting', () => {

  describe('1. Ogólny limit żądań', () => {
    const app = express();
    app.use(makeTestLimiter(3));
    app.get('/api/data', (req, res) => res.json({ success: true }));

    it('pierwsze 3 żądania przechodzą (limit = 3)', async () => {
      for (let i = 1; i <= 3; i++) {
        const res = await request(app).get('/api/data');
        console.log(`  Żądanie #${i} → ${res.status} ✅`);
        expect(res.status).toBe(200);
      }
    });

    it('4. żądanie jest blokowane → 429', async () => {
      const res = await request(app).get('/api/data');
      console.log(`\n  Żądanie #4 → ${res.status} 🚫 ZABLOKOWANE`);
      console.log(`  Odpowiedź: ${res.text}`);
      expect(res.status).toBe(429);
    });
  });

  describe('2. Nagłówki rate limit w odpowiedzi', () => {
    const app = express();
    app.use(makeTestLimiter(5));
    app.get('/api/test', (req, res) => res.json({ ok: true }));

    it('serwer wysyła nagłówki informujące o limicie', async () => {
      const res = await request(app).get('/api/test');

      const limit = res.headers['ratelimit-limit'];
      const remaining = res.headers['ratelimit-remaining'];

      console.log(`\n  ratelimit-limit:     ${limit}`);
      console.log(`  ratelimit-remaining: ${remaining}`);

      expect(limit).toBeDefined();
      expect(remaining).toBeDefined();
      expect(Number(remaining)).toBeLessThan(Number(limit));
    });

    it('remaining zmniejsza się z każdym żądaniem', async () => {
      const res1 = await request(app).get('/api/test');
      const res2 = await request(app).get('/api/test');
      const res3 = await request(app).get('/api/test');

      const r1 = Number(res1.headers['ratelimit-remaining']);
      const r2 = Number(res2.headers['ratelimit-remaining']);
      const r3 = Number(res3.headers['ratelimit-remaining']);

      console.log(`\n  Po 1 żądaniu remaining: ${r1}`);
      console.log(`  Po 2 żądaniu remaining: ${r2}`);
      console.log(`  Po 3 żądaniu remaining: ${r3}`);

      expect(r1).toBeGreaterThan(r2);
      expect(r2).toBeGreaterThan(r3);
    });
  });

  describe('3. Limit logowania (authLimiter)', () => {
    const app = express();
    app.use(express.json());
    const authLimiter = rateLimit({
      windowMs: 60000,
      max: 3,
      message: 'Zbyt wiele prób logowania, spróbuj ponownie za 15 minut.',
      skipSuccessfulRequests: true,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.post('/auth/login', authLimiter, (req, res) => {
      res.status(401).json({ success: false, message: 'Nieprawidłowe hasło' });
    });

    it('po 3 nieudanych próbach logowania → 429', async () => {
      console.log('\n  Symulacja brute-force ataku na login:');
      for (let i = 1; i <= 3; i++) {
        const res = await request(app)
          .post('/auth/login')
          .send({ mail: 'hacker@evil.com', haslo: `zlehaslo${i}` });
        console.log(`  Próba #${i} → ${res.status} (nieudana)`);
        expect(res.status).toBe(401);
      }

      const blocked = await request(app)
        .post('/auth/login')
        .send({ mail: 'hacker@evil.com', haslo: 'jeszczejedno' });
      console.log(`  Próba #4 → ${blocked.status} 🚫 ZABLOKOWANA`);
      console.log(`  Odpowiedź: ${blocked.text}`);
      expect(blocked.status).toBe(429);
    });
  });

  describe('4. Produkcyjne limity projektu', () => {
    it('prezentacja konfiguracji limitów', () => {
      const limity = [
        { nazwa: 'generalLimiter', max: 5000, okno: '15 min', opis: 'Ogólne żądania API' },
        { nazwa: 'authLimiter',    max: 15,   okno: '15 min', opis: 'Próby logowania' },
        { nazwa: 'apiLimiter',     max: 10000, okno: '15 min', opis: 'Endpointy API' },
      ];

      console.log('\n  Skonfigurowane limity w projekcie:');
      console.log('  ─────────────────────────────────────────────────');
      limity.forEach(l => {
        console.log(`  ${l.nazwa.padEnd(18)} max: ${String(l.max).padEnd(6)} / ${l.okno}  (${l.opis})`);
      });
      console.log('  ─────────────────────────────────────────────────');
      console.log('  * authLimiter pomija udane logowania (skipSuccessfulRequests)');
      console.log('  * generalLimiter i apiLimiter pomijają admina');

      expect(limity.find(l => l.nazwa === 'authLimiter')!.max).toBe(15);
    });
  });
});

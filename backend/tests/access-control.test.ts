import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, normalizeRole } from '../src/middleware/auth';
import type { AuthRequest } from '../src/middleware/auth';
import type { Response } from 'express';

const SECRET = 'test-secret-key';
process.env.JWT_SECRET = SECRET;

function makeToken(rola: string) {
  return jwt.sign({ id: 1, mail: 'test@test.pl', rola }, SECRET, { expiresIn: '1h' });
}

function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: any) => {
    const rola = normalizeRole(req.user?.rola);
    if (!roles.includes(rola)) {
      return res.status(403).json({ error: `Brak uprawnień. Wymagana rola: ${roles.join(' lub ')}` });
    }
    next();
  };
}

const app = express();
app.use(express.json());

app.get('/api/profil', requireAuth, (req: AuthRequest, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/api/admin/users', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Lista użytkowników (tylko admin)' });
});

app.get('/api/raporty', requireAuth, requireRole('admin', 'kierownik'), (req, res) => {
  res.json({ success: true, message: 'Raporty (admin i kierownik)' });
});

app.get('/api/zlecenia', requireAuth, requireRole('admin', 'kierownik', 'mechanik', 'recepcja'), (req, res) => {
  res.json({ success: true, message: 'Zlecenia (tylko pracownicy)' });
});

describe('Kontrola dostępu (RBAC)', () => {

  describe('1. Brak tokenu', () => {
    it('zwraca 401 gdy brak nagłówka Authorization', async () => {
      const res = await request(app).get('/api/profil');
      console.log(`\n🚫 GET /api/profil (bez tokenu) → ${res.status}: ${JSON.stringify(res.body)}`);
      expect(res.status).toBe(401);
    });

    it('zwraca 401 gdy niepoprawny token', async () => {
      const res = await request(app)
        .get('/api/profil')
        .set('Authorization', 'Bearer FALSZYWY_TOKEN_123');
      console.log(`🚫 GET /api/profil (zły token) → ${res.status}: ${JSON.stringify(res.body)}`);
      expect(res.status).toBe(401);
    });
  });

  describe('2. Poprawna autoryzacja', () => {
    it('klient może zobaczyć swój profil', async () => {
      const token = makeToken('klient');
      const res = await request(app)
        .get('/api/profil')
        .set('Authorization', `Bearer ${token}`);
      console.log(`\n✅ GET /api/profil (klient) → ${res.status}: ${JSON.stringify(res.body)}`);
      expect(res.status).toBe(200);
      expect(res.body.user.rola).toBe('klient');
    });

    it('admin może zobaczyć profil', async () => {
      const token = makeToken('admin');
      const res = await request(app)
        .get('/api/profil')
        .set('Authorization', `Bearer ${token}`);
      console.log(`✅ GET /api/profil (admin) → ${res.status}`);
      expect(res.status).toBe(200);
    });
  });

  describe('3. Blokowanie nieuprawnionych ról', () => {
    it('klient NIE może wejść na panel admina → 403', async () => {
      const token = makeToken('klient');
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      console.log(`\n🔒 GET /api/admin/users (klient) → ${res.status}: ${JSON.stringify(res.body)}`);
      expect(res.status).toBe(403);
    });

    it('mechanik NIE może wejść na panel admina → 403', async () => {
      const token = makeToken('mechanik');
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      console.log(`🔒 GET /api/admin/users (mechanik) → ${res.status}: ${JSON.stringify(res.body)}`);
      expect(res.status).toBe(403);
    });

    it('admin MA dostęp do panelu admina → 200', async () => {
      const token = makeToken('admin');
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      console.log(`✅ GET /api/admin/users (admin) → ${res.status}`);
      expect(res.status).toBe(200);
    });
  });

  describe('4. Dostęp wielorolowy', () => {
    it('klient NIE może oglądać raportów → 403', async () => {
      const token = makeToken('klient');
      const res = await request(app)
        .get('/api/raporty')
        .set('Authorization', `Bearer ${token}`);
      console.log(`\n🔒 GET /api/raporty (klient) → ${res.status}`);
      expect(res.status).toBe(403);
    });

    it('kierownik MA dostęp do raportów → 200', async () => {
      const token = makeToken('kierownik');
      const res = await request(app)
        .get('/api/raporty')
        .set('Authorization', `Bearer ${token}`);
      console.log(`✅ GET /api/raporty (kierownik) → ${res.status}`);
      expect(res.status).toBe(200);
    });

    it('klient NIE może widzieć zleceń pracowniczych → 403', async () => {
      const token = makeToken('klient');
      const res = await request(app)
        .get('/api/zlecenia')
        .set('Authorization', `Bearer ${token}`);
      console.log(`\n🔒 GET /api/zlecenia (klient) → ${res.status}`);
      expect(res.status).toBe(403);
    });

    it('mechanik MA dostęp do zleceń → 200', async () => {
      const token = makeToken('mechanik');
      const res = await request(app)
        .get('/api/zlecenia')
        .set('Authorization', `Bearer ${token}`);
      console.log(`✅ GET /api/zlecenia (mechanik) → ${res.status}`);
      expect(res.status).toBe(200);
    });
  });
});

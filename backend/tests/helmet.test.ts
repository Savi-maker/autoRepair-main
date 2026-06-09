import request from 'supertest';
import express from 'express';
import { helmetMiddleware } from '../src/middleware/security';

const app = express();
app.use(helmetMiddleware());
app.get('/test', (req, res) => res.json({ ok: true }));

describe('Helmet Middleware', () => {
  it('Content-Security-Policy', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('HSTS', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
  });

  it('X-Content-Type-Options', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

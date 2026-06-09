import request from 'supertest';
import express from 'express';
import { sanitizeInput } from '../src/middleware/security';

const app = express();
app.use(express.json());
app.use(sanitizeInput);
app.post('/test', (req, res) => res.json(req.body));

describe('Sanitization Middleware', () => {
  it('HTML tags', async () => {
    const res = await request(app).post('/test').send({
      message: '<script>alert("hack")</script>Hello'
    });
    expect(res.body.message).toBe('alert("hack")Hello');
    expect(res.body.message).not.toContain('<');
    expect(res.body.message).not.toContain('>');
  });

  it('event handlers', async () => {
    const res = await request(app).post('/test').send({
      message: '<img src=x onerror="alert(1)">'
    });
    expect(res.body.message).not.toContain('onerror=');
  });

  it('500 znaków', async () => {
    const longText = 'a'.repeat(1000);
    const res = await request(app).post('/test').send({
      message: longText
    });
    expect(res.body.message.length).toBe(500);
  });

  it('spacje', async () => {
    const res = await request(app).post('/test').send({
      message: '   hello   world   '
    });
    expect(res.body.message).toBe('hello   world');
  });

  it('zagnieżdżone obiekty', async () => {
    const res = await request(app).post('/test').send({
      user: {
        name: '<b>John</b>',
        comment: '<script>evil</script>'
      }
    });
    expect(res.body.user.name).toBe('John');
    expect(res.body.user.name).not.toContain('<');
    expect(res.body.user.comment).toBe('evil');
    expect(res.body.user.comment).not.toContain('script');
  });
});

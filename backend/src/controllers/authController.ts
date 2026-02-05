import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { get, run } from "../db.js";
import { normalizeRole } from "../middleware/auth.js";

type UserRow = {
  id: number;
  imie: string;
  nazwisko: string;
  mail: string;
  telefon: string | null;
  rola: string;
  haslo: string;
  customer_id?: number;
};

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;
function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + LOCKOUT_TIME });
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, remainingAttempts: 0 };
  }

  attempt.count++;
  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.count };
}

function clearRateLimit(identifier: string) {
  loginAttempts.delete(identifier);
}

function signToken(user: { id: number; mail: string; rola: string; customer_id?: number }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Brak JWT_SECRET w .env");

  const role = normalizeRole(user.rola);
  const payload: any = { id: user.id, mail: user.mail, rola: role };
  if ((role === "user" || role === "klient") && user.customer_id) {
    payload.customer_id = user.customer_id;
  }
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export async function register(req: Request, res: Response) {
  const { imie, nazwisko, mail, telefon, haslo } = req.body ?? {};

  if (!imie || !nazwisko || !mail || !haslo) {
    return res.status(400).json({ success: false, message: "Brak wymaganych pól: imie, nazwisko, mail, haslo" });
  }

  const sanitizedMail = String(mail).trim().toLowerCase();
  const sanitizedImie = String(imie).trim();
  const sanitizedNazwisko = String(nazwisko).trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedMail)) {
    return res.status(400).json({ success: false, message: "Nieprawidłowy format adresu email" });
  }

  const existing = await get<UserRow>(`SELECT * FROM users WHERE mail = ?`, [sanitizedMail]);
  if (existing) {
    return res.status(409).json({ success: false, message: "Użytkownik o takim mailu już istnieje" });
  }

  const customerRes = await run(
    `INSERT INTO customers (name, email, phone, notes) VALUES (?, ?, ?, ?)`
    ,
    [`${sanitizedImie} ${sanitizedNazwisko}`.trim(), sanitizedMail, telefon ?? null, null]
  );

  const doubleHashed = await bcrypt.hash(String(haslo), 10);

  const result = await run(
    `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo, customer_id) VALUES (?, ?, ?, ?, 'klient', ?, ?)`,
    [sanitizedImie, sanitizedNazwisko, sanitizedMail, telefon ?? null, doubleHashed, customerRes.lastID]
  );

  const user = { id: result.lastID, mail: sanitizedMail, rola: "klient", customer_id: customerRes.lastID };
  const token = signToken(user);

  return res.status(201).json({
    success: true,
    message: "Registered",
    data: {
      id: user.id,
      token,
      user: { id: user.id, mail: user.mail, rola: user.rola, imie: sanitizedImie, nazwisko: sanitizedNazwisko }
    }
  });
}

export async function login(req: Request, res: Response) {
  const { mail, haslo } = req.body ?? {};
  if (!mail || !haslo) {
    return res.status(400).json({ success: false, message: "Brak pól: mail, haslo" });
  }

  const sanitizedMail = String(mail).trim().toLowerCase();

  const rateLimitCheck = checkRateLimit(sanitizedMail);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({ 
      success: false, 
      message: `Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.` 
    });
  }

  const user = await get<UserRow>(`SELECT * FROM users WHERE mail = ?`, [sanitizedMail]);
  if (!user) {
    return res.status(401).json({ success: false, message: "Nieprawidłowy mail lub hasło" });
  }

  const ok = await bcrypt.compare(String(haslo), user.haslo);
  if (!ok) {
    return res.status(401).json({ 
      success: false, 
      message: `Nieprawidłowy mail lub hasło. Pozostałe próby: ${rateLimitCheck.remainingAttempts}` 
    });
  }

  clearRateLimit(sanitizedMail);

  const role = normalizeRole(user.rola);
  const token = signToken({ id: user.id, mail: user.mail, rola: role, customer_id: user.customer_id });

  return res.json({
    success: true,
    message: "Zalogowano",
    data: {
      token,
      user: { id: user.id, mail: user.mail, rola: role, imie: user.imie, nazwisko: user.nazwisko }
    }
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { mail, imie, nowe_haslo } = req.body ?? {};
  if (!mail || !imie || !nowe_haslo) {
    return res.status(400).json({ success: false, message: "Brak pól: mail, imie, nowe_haslo" });
  }

  const sanitizedMail = String(mail).trim().toLowerCase();
  const sanitizedImie = String(imie).trim();

  const user = await get<UserRow>(`SELECT * FROM users WHERE mail = ?`, [sanitizedMail]);
  if (!user || user.imie !== sanitizedImie) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const doubleHashed = await bcrypt.hash(String(nowe_haslo), 10);
  await run(`UPDATE users SET haslo = ? WHERE id = ?`, [doubleHashed, user.id]);

  clearRateLimit(sanitizedMail);

  return res.json({ success: true, message: "Haslo zmienione" });
}


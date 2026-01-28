import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { get, run } from "../db.js";

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

function signToken(user: { id: number; mail: string; rola: string; customer_id?: number }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Brak JWT_SECRET w .env");

  const payload: any = { id: user.id, mail: user.mail, rola: user.rola };
  if (user.rola === "user" && user.customer_id) {
    payload.customer_id = user.customer_id;
  }
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export async function register(req: Request, res: Response) {
  const { imie, nazwisko, mail, telefon, haslo } = req.body ?? {};

  if (!imie || !nazwisko || !mail || !haslo) {
    return res.status(400).json({ success: false, message: "Brak wymaganych pĂłl: imie, nazwisko, mail, haslo" });
  }

  const existing = await get<UserRow>(`SELECT * FROM users WHERE mail = ?`, [mail]);
  if (existing) {
    return res.status(409).json({ success: false, message: "UĹĽytkownik o takim mailu juĹĽ istnieje" });
  }

  const hashed = await bcrypt.hash(String(haslo), 10);

  const result = await run(
    `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo) VALUES (?, ?, ?, ?, 'user', ?)`,
    [imie, nazwisko, mail, telefon ?? null, hashed]
  );

  const user = { id: result.lastID, mail, rola: "user" };
  const token = signToken(user);

  return res.status(201).json({
    success: true,
    message: "Registered",
    data: {
      id: user.id,
      token,
      user: { id: user.id, mail: user.mail, rola: user.rola, imie, nazwisko }
    }
  });
}

export async function login(req: Request, res: Response) {
  const { mail, haslo } = req.body ?? {};
  if (!mail || !haslo) {
    return res.status(400).json({ success: false, message: "Brak pĂłl: mail, haslo" });
  }

  const user = await get<UserRow>(`SELECT * FROM users WHERE mail = ?`, [mail]);
  if (!user) {
    return res.status(401).json({ success: false, message: "NieprawidĹ‚owy mail lub hasĹ‚o" });
  }

  const ok = await bcrypt.compare(String(haslo), user.haslo);
  if (!ok) {
    return res.status(401).json({ success: false, message: "NieprawidĹ‚owy mail lub hasĹ‚o" });
  }

  const token = signToken({ id: user.id, mail: user.mail, rola: user.rola, customer_id: user.customer_id });

  return res.json({
    success: true,
    message: "Zalogowano",
    data: {
      token,
      user: { id: user.id, mail: user.mail, rola: user.rola, imie: user.imie, nazwisko: user.nazwisko }
    }
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { mail, imie, nowe_haslo } = req.body ?? {};
  if (!mail || !imie || !nowe_haslo) {
    return res.status(400).json({ success: false, message: "Brak pĂłl: mail, imie, nowe_haslo" });
  }

  const user = await get<UserRow>(`SELECT * FROM users WHERE mail = ?`, [mail]);
  if (!user || user.imie !== imie) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const hashed = await bcrypt.hash(String(nowe_haslo), 10);
  await run(`UPDATE users SET haslo = ? WHERE id = ?`, [hashed, user.id]);

  return res.json({ success: true, message: "Haslo zmienione" });
}


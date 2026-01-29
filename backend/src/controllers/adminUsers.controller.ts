import type { Response } from "express";
import bcrypt from "bcryptjs";
import type { AuthRequest } from "../middleware/auth.js";
import { normalizeRole } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

function isAdmin(req: AuthRequest) {
  const role = String(req.user?.rola ?? "").toLowerCase();
  return role === "admin";
}

export async function listAdminUsers(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const q = String((req.query.q ?? "") as string).trim();
    const rows = q
      ? await all(
          `SELECT id, imie, nazwisko, mail, telefon, rola, status, last_login_at, created_at
           FROM users
           WHERE imie LIKE ? OR nazwisko LIKE ? OR mail LIKE ? OR telefon LIKE ?
           ORDER BY id DESC`,
          [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
        )
      : await all(
          `SELECT id, imie, nazwisko, mail, telefon, rola, status, last_login_at, created_at
           FROM users
           ORDER BY id DESC`
        );

    const data = (rows || []).map((r: any) => ({ ...r, rola: normalizeRole(r.rola) }));
    return res.json({ success: true, message: "OK", data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createAdminUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const { imie, nazwisko, mail, telefon, rola, haslo } = req.body ?? {};

    const i = String(imie ?? "").trim();
    const n = String(nazwisko ?? "").trim();
    const m = String(mail ?? "").trim().toLowerCase();
    const t = telefon != null ? String(telefon).trim() : null;
    const r = normalizeRole(rola ?? "user");
    const p = String(haslo ?? "");

    if (!i) return res.status(400).json({ success: false, message: "Brak pola: imie" });
    if (!n) return res.status(400).json({ success: false, message: "Brak pola: nazwisko" });
    if (!m) return res.status(400).json({ success: false, message: "Brak pola: mail" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) {
      return res.status(400).json({ success: false, message: "Nieprawidłowy email" });
    }
    if (!p || p.length < 6) return res.status(400).json({ success: false, message: "Hasło musi mieć min. 6 znaków" });

    const existing = await get<{ id: number }>(`SELECT id FROM users WHERE mail = ?`, [m]);
    if (existing) return res.status(409).json({ success: false, message: "Użytkownik z takim mailem już istnieje" });

    const hash = await bcrypt.hash(p, 10);

    const result = await run(
      `INSERT INTO users (imie, nazwisko, mail, telefon, rola, haslo, status)
       VALUES (?, ?, ?, ?, ?, ?, 'aktywny')`,
      [i, n, m, t, r, hash]
    );

    const created = await get(
      `SELECT id, imie, nazwisko, mail, telefon, rola, status, last_login_at, created_at
       FROM users
       WHERE id = ?`,
      [result.lastID]
    );

    return res.status(201).json({ success: true, message: "Created", data: { ...created, rola: normalizeRole((created as any).rola) } });
  } catch (e: any) {
    const msg = String(e?.message || "").toLowerCase();
    if (msg.includes("unique")) {
      return res.status(409).json({ success: false, message: "Duplikat (mail/unikalny)" });
    }
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function updateAdminUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const { status, rola } = req.body ?? {};
    if (status == null && rola == null) {
      return res.status(400).json({ success: false, message: "Podaj pole do aktualizacji" });
    }

    const existing = await get<{ id: number }>(`SELECT id FROM users WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "User not found" });

    const fields: string[] = [];
    const params: any[] = [];

    if (status != null) {
      const s = String(status).trim();
      fields.push("status = ?");
      params.push(s);
    }

    if (rola != null) {
      const r = normalizeRole(rola);
      fields.push("rola = ?");
      params.push(r);
    }

    params.push(id);

    await run(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await get(
      `SELECT id, imie, nazwisko, mail, telefon, rola, status, last_login_at, created_at
       FROM users
       WHERE id = ?`,
      [id]
    );

    return res.json({ success: true, message: "Updated", data: { ...updated, rola: normalizeRole((updated as any).rola) } });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function adminResetPassword(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const { mail, imie, nowe_haslo } = req.body ?? {};
    const m = String(mail ?? "").trim().toLowerCase();
    const i = String(imie ?? "").trim();
    const p = String(nowe_haslo ?? "");

    if (!m) return res.status(400).json({ success: false, message: "Brak pola: mail" });
    if (!i) return res.status(400).json({ success: false, message: "Brak pola: imie" });
    if (!p || p.length < 6) return res.status(400).json({ success: false, message: "Hasło musi mieć min. 6 znaków" });

    const user = await get<{ id: number; imie: string }>(`SELECT id, imie FROM users WHERE mail = ?`, [m]);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (String(user.imie ?? "").trim() !== i) {
      return res.status(400).json({ success: false, message: "Dane nie pasują" });
    }

    const hash = await bcrypt.hash(p, 10);
    await run(`UPDATE users SET haslo = ? WHERE id = ?`, [hash, user.id]);

    return res.json({ success: true, message: "Hasło zresetowane" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


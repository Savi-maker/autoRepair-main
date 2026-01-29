import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { normalizeRole } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

function canViewSuppliers(role: string) {
  return role === "admin" || role === "recepcja";
}

function canManageSuppliers(role: string) {
  return role === "admin" || role === "recepcja";
}

export async function listSuppliers(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (!canViewSuppliers(role)) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const q = String((req.query.q ?? "") as string).trim();
    const rows = q
      ? await all(
          `SELECT * FROM suppliers
           WHERE name LIKE ? OR contact_person LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?
           ORDER BY id DESC`,
          [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
        )
      : await all(`SELECT * FROM suppliers ORDER BY id DESC`);

    return res.json({ success: true, message: "OK", data: rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function getSupplierById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (!canViewSuppliers(role)) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const row = await get(`SELECT * FROM suppliers WHERE id = ?`, [id]);
    if (!row) return res.status(404).json({ success: false, message: "Supplier not found" });

    return res.json({ success: true, message: "OK", data: row });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createSupplier(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (!canManageSuppliers(role)) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const { name, contact_person, email, phone, address, city, postal_code, payment_terms, rating, is_active } = req.body ?? {};
    if (!name) return res.status(400).json({ success: false, message: "Brak pola: name" });

    const existing = await get<{ id: number }>(`SELECT id FROM suppliers WHERE name = ?`, [String(name)]);
    if (existing) return res.status(409).json({ success: false, message: "Dostawca o takiej nazwie już istnieje" });

    const result = await run(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, city, postal_code, payment_terms, rating, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        String(name),
        contact_person ?? null,
        email ?? null,
        phone ?? null,
        address ?? null,
        city ?? null,
        postal_code ?? null,
        payment_terms ?? null,
        rating ?? null,
        is_active ?? 1,
      ]
    );

    const created = await get(`SELECT * FROM suppliers WHERE id = ?`, [result.lastID]);
    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    const msg = String(e?.message || "DB error");
    if (msg.includes("UNIQUE")) {
      return res.status(409).json({ success: false, message: "Dostawca o takiej nazwie już istnieje" });
    }
    return res.status(500).json({ success: false, message: msg });
  }
}

export async function updateSupplier(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (!canManageSuppliers(role)) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const { name, contact_person, email, phone, address, city, postal_code, payment_terms, rating, is_active } = req.body ?? {};
    if (
      name == null &&
      contact_person == null &&
      email == null &&
      phone == null &&
      address == null &&
      city == null &&
      postal_code == null &&
      payment_terms == null &&
      rating == null &&
      is_active == null
    ) {
      return res.status(400).json({ success: false, message: "Podaj pole do aktualizacji" });
    }

    const existing = await get<{ id: number }>(`SELECT id FROM suppliers WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Supplier not found" });

    if (name != null) {
      const dup = await get<{ id: number }>(`SELECT id FROM suppliers WHERE name = ? AND id != ?`, [String(name), id]);
      if (dup) return res.status(409).json({ success: false, message: "Dostawca o takiej nazwie już istnieje" });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (name != null) { fields.push("name = ?"); params.push(String(name)); }
    if (contact_person != null) { fields.push("contact_person = ?"); params.push(contact_person); }
    if (email != null) { fields.push("email = ?"); params.push(email); }
    if (phone != null) { fields.push("phone = ?"); params.push(phone); }
    if (address != null) { fields.push("address = ?"); params.push(address); }
    if (city != null) { fields.push("city = ?"); params.push(city); }
    if (postal_code != null) { fields.push("postal_code = ?"); params.push(postal_code); }
    if (payment_terms != null) { fields.push("payment_terms = ?"); params.push(payment_terms); }
    if (rating != null) { fields.push("rating = ?"); params.push(rating); }
    if (is_active != null) { fields.push("is_active = ?"); params.push(is_active ? 1 : 0); }

    params.push(id);

    await run(`UPDATE suppliers SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await get(`SELECT * FROM suppliers WHERE id = ?`, [id]);
    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    const msg = String(e?.message || "DB error");
    if (msg.includes("UNIQUE")) {
      return res.status(409).json({ success: false, message: "Dostawca o takiej nazwie już istnieje" });
    }
    return res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteSupplier(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (role !== "admin") return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const existing = await get<{ id: number }>(`SELECT id FROM suppliers WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Supplier not found" });

    await run(`DELETE FROM suppliers WHERE id = ?`, [id]);
    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

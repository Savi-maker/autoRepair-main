import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

export async function listCustomers(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const q = String((req.query.q ?? "") as string).trim();
    const rows = q
      ? await all(
          `SELECT id, name, email, phone, notes, created_at
           FROM customers
           WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
           ORDER BY id DESC`,
          [`%${q}%`, `%${q}%`, `%${q}%`]
        )
      : await all(
          `SELECT id, name, email, phone, notes, created_at
           FROM customers
           ORDER BY id DESC`
        );

    return res.json({ success: true, message: "OK", data: rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function getCustomerById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const row = await get(
      `SELECT id, name, email, phone, notes, created_at
       FROM customers
       WHERE id = ?`,
      [id]
    );

    if (!row) return res.status(404).json({ success: false, message: "Customer not found" });

    return res.json({ success: true, message: "OK", data: row });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createCustomer(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const { name, email, phone, notes } = req.body ?? {};
    if (!name) return res.status(400).json({ success: false, message: "Brak pola: name" });

    const result = await run(
      `INSERT INTO customers (name, email, phone, notes)
       VALUES (?, ?, ?, ?)`,
      [String(name), email ?? null, phone ?? null, notes ?? null]
    );

    const created = await get(
      `SELECT id, name, email, phone, notes, created_at
       FROM customers
       WHERE id = ?`,
      [result.lastID]
    );

    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function updateCustomer(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const { name, email, phone, notes } = req.body ?? {};
    if (name == null && email == null && phone == null && notes == null) {
      return res.status(400).json({ success: false, message: "Podaj pole do aktualizacji" });
    }

    const existing = await get<{ id: number }>(`SELECT id FROM customers WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Customer not found" });

    const fields: string[] = [];
    const params: any[] = [];

    if (name != null) {
      fields.push("name = ?");
      params.push(String(name));
    }
    if (email != null) {
      fields.push("email = ?");
      params.push(email);
    }
    if (phone != null) {
      fields.push("phone = ?");
      params.push(phone);
    }
    if (notes != null) {
      fields.push("notes = ?");
      params.push(notes);
    }

    params.push(id);

    await run(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await get(
      `SELECT id, name, email, phone, notes, created_at
       FROM customers
       WHERE id = ?`,
      [id]
    );

    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function deleteCustomer(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const existing = await get<{ id: number }>(`SELECT id FROM customers WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Customer not found" });

    await run(`DELETE FROM customers WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


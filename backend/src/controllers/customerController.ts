import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { normalizeRole } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

export async function listCustomers(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: "Nieprawidłowe page/limit" });
    }

    const offset = (page - 1) * limit;

    const role = normalizeRole(req.user.rola);
    const isUser = role === "user" || role === "klient";
    const isViewer = role === "admin" || role === "kierownik" || role === "recepcja" || role === "mechanik" || isUser;
    if (!isViewer) return res.status(403).json({ success: false, message: "Brak uprawnieĹ„" });

    const q = String((req.query.q ?? "") as string).trim();

    if (isUser) {
      if (!req.user.customer_id) {
        return res.json({ success: true, message: "OK", data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }

      const row = await get(
        `SELECT id, name, email, phone, notes, created_at
         FROM customers
         WHERE id = ?`,
        [req.user.customer_id]
      );
      return res.json({ success: true, message: "OK", data: row ? [row] : [], pagination: { page, limit, total: row ? 1 : 0, totalPages: row ? 1 : 0 } });
    }

    let query = `SELECT id, name, email, phone, notes, created_at
           FROM customers`;
    let params: any[] = [];

    if (q) {
      query += ` WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`;
      params = [`%${q}%`, `%${q}%`, `%${q}%`];
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await all(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM customers`;
    let countParams: any[] = [];
    if (q) {
      countQuery += ` WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`;
      countParams = [`%${q}%`, `%${q}%`, `%${q}%`];
    }
    const countRow = await get(countQuery, countParams);
    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return res.json({ success: true, message: "OK", data: rows, pagination: { page, limit, total, totalPages } });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function getCustomerById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    const isViewer = role === "admin" || role === "kierownik" || role === "recepcja" || role === "mechanik" || role === "user" || role === "klient";
    if (!isViewer) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    if ((role === "user" || role === "klient") && req.user.customer_id && id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

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

    const role = normalizeRole(req.user.rola);
    if (role !== "admin" && role !== "kierownik" && role !== "recepcja") {
      return res.status(403).json({ success: false, message: "Brak uprawnieĹ„" });
    }

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

    const role = normalizeRole(req.user.rola);
    if (role !== "admin" && role !== "kierownik" && role !== "recepcja") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

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

    const role = normalizeRole(req.user.rola);
    if (role !== "admin" && role !== "kierownik") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const existing = await get<{ id: number }>(`SELECT id FROM customers WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Customer not found" });

    await run(`DELETE FROM customers WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


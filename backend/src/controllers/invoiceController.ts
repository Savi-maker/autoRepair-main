import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { normalizeRole } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

const allowedStatuses = new Set(["oczekuje", "zaplacona", "anulowana", "przeterminowana"]);

export async function listInvoices(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    const canView = role === "admin" || role === "kierownik" || role === "recepcja" || role === "user" || role === "klient";
    if (!canView) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const q = String((req.query.q ?? "") as string).trim();
    const isCustomer = role === "user" || role === "klient";
    const customerId = req.user.customer_id;
    if (isCustomer && !customerId) {
      return res.json({ success: true, message: "OK", data: [] });
    }

    let baseQuery = `SELECT
      i.id, i.number, i.customer_id, i.order_id, i.issue_date, i.due_date, i.amount, i.status, i.pdf_path, i.created_at,
      c.name AS customer_name,
      o.service AS order_service
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN orders o ON o.id = i.order_id`;

    let whereConditions: string[] = [];
    let params: any[] = [];

    if (isCustomer) {
      whereConditions.push(`i.customer_id = ?`);
      params.push(customerId);
    }

    if (q) {
      whereConditions.push(`(i.number LIKE ? OR c.name LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`);
    }

    const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(" AND ")}` : "";
    const query = baseQuery + whereClause + ` ORDER BY i.id DESC`;

    const rows = await all(query, params);

    return res.json({ success: true, message: "OK", data: rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function getInvoiceById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    const canView = role === "admin" || role === "kierownik" || role === "recepcja" || role === "user" || role === "klient";
    if (!canView) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const row = await get(
      `SELECT
        i.*,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        o.service AS order_service,
        o.status AS order_status
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      LEFT JOIN orders o ON o.id = i.order_id
      WHERE i.id = ?`,
      [id]
    );

    if (!row) return res.status(404).json({ success: false, message: "Invoice not found" });

    if ((role === "user" || role === "klient") && req.user.customer_id && row.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    return res.json({ success: true, message: "OK", data: row });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createInvoice(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (role !== "admin" && role !== "kierownik") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const { number, customer_id, order_id, issue_date, due_date, amount, status, pdf_path } = req.body ?? {};

    if (!number || !customer_id || !issue_date || amount == null) {
      return res.status(400).json({
        success: false,
        message: "Brak pĂłl: number, customer_id, issue_date, amount"
      });
    }

    if (status != null && !allowedStatuses.has(String(status))) {
      return res.status(400).json({
        success: false,
        message: "Nieprawidłowy status",
        allowed: Array.from(allowedStatuses)
      });
    }

    const cust = await get<{ id: number }>(`SELECT id FROM customers WHERE id = ?`, [Number(customer_id)]);
    if (!cust) return res.status(400).json({ success: false, message: "Nie istnieje customer_id" });

    if (order_id != null) {
      const ord = await get<{ id: number }>(`SELECT id FROM orders WHERE id = ?`, [Number(order_id)]);
      if (!ord) return res.status(400).json({ success: false, message: "Nie istnieje order_id" });
    }

    const existingNum = await get<{ id: number }>(`SELECT id FROM invoices WHERE number = ?`, [String(number)]);
    if (existingNum) return res.status(409).json({ success: false, message: "Faktura o takim numerze już istnieje" });

    const result = await run(
      `INSERT INTO invoices (number, customer_id, order_id, issue_date, due_date, amount, status, pdf_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(number),
        Number(customer_id),
        order_id ?? null,
        issue_date,
        due_date ?? null,
        Number(amount),
        status ?? "oczekuje",
        pdf_path ?? null
      ]
    );

    const created = await get(`SELECT * FROM invoices WHERE id = ?`, [result.lastID]);

    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    const msg = String(e?.message || "DB error");
    if (msg.includes("UNIQUE constraint failed: invoices.number")) {
      return res.status(409).json({ success: false, message: "Faktura o takim numerze już istnieje" });
    }
    return res.status(500).json({ success: false, message: msg });
  }
}

export async function updateInvoice(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (role !== "admin" && role !== "kierownik") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const { number, customer_id, order_id, issue_date, due_date, amount, status, pdf_path } = req.body ?? {};

    if (
      number == null &&
      customer_id == null &&
      order_id == null &&
      issue_date == null &&
      due_date == null &&
      amount == null &&
      status == null &&
      pdf_path == null
    ) {
      return res.status(400).json({ success: false, message: "Podaj pole do aktualizacji" });
    }

    if (status != null && !allowedStatuses.has(String(status))) {
      return res.status(400).json({
        success: false,
        message: "Nieprawidłowy status",
        allowed: Array.from(allowedStatuses)
      });
    }

    const existing = await get<{ id: number }>(`SELECT id FROM invoices WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Invoice not found" });

    if (customer_id != null) {
      const cust = await get<{ id: number }>(`SELECT id FROM customers WHERE id = ?`, [Number(customer_id)]);
      if (!cust) return res.status(400).json({ success: false, message: "Nie istnieje customer_id" });
    }

    if (order_id != null) {
      const ord = await get<{ id: number }>(`SELECT id FROM orders WHERE id = ?`, [Number(order_id)]);
      if (!ord) return res.status(400).json({ success: false, message: "Nie istnieje order_id" });
    }

    if (number != null) {
      const dup = await get<{ id: number }>(`SELECT id FROM invoices WHERE number = ? AND id != ?`, [String(number), id]);
      if (dup) return res.status(409).json({ success: false, message: "Faktura o takim numerze już istnieje" });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (number != null) {
      fields.push("number = ?");
      params.push(String(number));
    }
    if (customer_id != null) {
      fields.push("customer_id = ?");
      params.push(Number(customer_id));
    }
    if (order_id != null) {
      fields.push("order_id = ?");
      params.push(Number(order_id));
    }
    if (issue_date != null) {
      fields.push("issue_date = ?");
      params.push(issue_date);
    }
    if (due_date != null) {
      fields.push("due_date = ?");
      params.push(due_date);
    }
    if (amount != null) {
      fields.push("amount = ?");
      params.push(Number(amount));
    }
    if (status != null) {
      fields.push("status = ?");
      params.push(String(status));
    }
    if (pdf_path != null) {
      fields.push("pdf_path = ?");
      params.push(pdf_path);
    }

    params.push(id);

    await run(`UPDATE invoices SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await get(`SELECT * FROM invoices WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    const msg = String(e?.message || "DB error");
    if (msg.includes("UNIQUE constraint failed: invoices.number")) {
      return res.status(409).json({ success: false, message: "Faktura o takim numerze już istnieje" });
    }
    return res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteInvoice(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (role !== "admin" && role !== "kierownik") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const existing = await get<{ id: number }>(`SELECT id FROM invoices WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Invoice not found" });

    await run(`DELETE FROM invoices WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


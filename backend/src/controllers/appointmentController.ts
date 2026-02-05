import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

const allowedStatuses = new Set(["oczekujacy", "zaakceptowany", "wykonano"]);

export async function listAppointments(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: "Nieprawidłowe page/limit" });
    }

    const offset = (page - 1) * limit;

    const isCustomer = req.user.rola === "user" || req.user.rola === "klient";
    const customerId = req.user.customer_id;

    let query = `SELECT
      a.id, a.title, a.start_at, a.end_at, a.status, a.notes, a.created_at,
      a.customer_id, a.vehicle_id, a.order_id,
      c.name AS customer_name,
      v.make AS vehicle_make,
      v.model AS vehicle_model,
      v.plate AS vehicle_plate
    FROM appointments a
    LEFT JOIN customers c ON c.id = a.customer_id
    LEFT JOIN vehicles v ON v.id = a.vehicle_id`;

    let params: any[] = [];

    if (isCustomer && customerId) {
      query += ` WHERE a.customer_id = ?`;
      params = [customerId];
    }

    query += ` ORDER BY a.start_at ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await all(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM appointments a`;
    let countParams: any[] = [];
    if (isCustomer && customerId) {
      countQuery += ` WHERE a.customer_id = ?`;
      countParams = [customerId];
    }
    const countRow = await get(countQuery, countParams);
    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      message: "OK",
      data: rows,
      pagination: { page, limit, total, totalPages }
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function getAppointmentById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Nieprawidłowe id" });
    }

    const row = await get(
      `SELECT
        a.*, 
        c.name AS customer_name,
        c.phone AS customer_phone,
        v.make AS vehicle_make,
        v.model AS vehicle_model,
        v.plate AS vehicle_plate
      FROM appointments a
      LEFT JOIN customers c ON c.id = a.customer_id
      LEFT JOIN vehicles v ON v.id = a.vehicle_id
      WHERE a.id = ?`,
      [id]
    );

    if (!row) return res.status(404).json({ success: false, message: "Appointment not found" });

    return res.json({ success: true, message: "OK", data: row });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createAppointment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const { title, start_at, end_at, status, customer_id, vehicle_id, order_id, notes } = req.body ?? {};

    if (!title || !start_at) {
      return res.status(400).json({
        success: false,
        message: "Brak pĂłl: title, start_at"
      });
    }


    const isCustomer = req.user.rola === "user" || req.user.rola === "klient";
    
    let finalCustomerId = customer_id;
    if (isCustomer && req.user.customer_id) {
      finalCustomerId = req.user.customer_id;
    } else if (isCustomer && customer_id && customer_id !== req.user.customer_id) {
      return res.status(403).json({ error: "Nie możesz tworzyć wizyt dla innych klientów" });
    }

    if (status != null && !allowedStatuses.has(String(status))) {
      return res.status(400).json({
        success: false,
        message: "Nieprawidłowy status",
        allowed: Array.from(allowedStatuses)
      });
    }

    if (customer_id != null) {
      const c = await get(`SELECT id FROM customers WHERE id = ?`, [Number(customer_id)]);
      if (!c) return res.status(400).json({ success: false, message: "Nie istnieje customer_id" });
    }

    if (vehicle_id != null) {
      const v = await get(`SELECT id FROM vehicles WHERE id = ?`, [Number(vehicle_id)]);
      if (!v) return res.status(400).json({ success: false, message: "Nie istnieje vehicle_id" });
    }

    if (order_id != null) {
      const o = await get(`SELECT id FROM orders WHERE id = ?`, [Number(order_id)]);
      if (!o) return res.status(400).json({ success: false, message: "Nie istnieje order_id" });
    }

    const result = await run(
      `INSERT INTO appointments
        (title, start_at, end_at, status, customer_id, vehicle_id, order_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(title),
        start_at,
        end_at ?? null,
        status ?? "oczekujacy",
        finalCustomerId ?? null,
        vehicle_id ?? null,
        order_id ?? null,
        notes ?? null
      ]
    );

    const created = await get(`SELECT * FROM appointments WHERE id = ?`, [result.lastID]);

    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function updateAppointment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Nieprawidłowe id" });
    }

    const { title, start_at, end_at, status, notes, order_id } = req.body ?? {};
    if (title == null && start_at == null && end_at == null && status == null && notes == null && order_id == null) {
      return res.status(400).json({ success: false, message: "Podaj pole do aktualizacji" });
    }

    if (status != null && !allowedStatuses.has(String(status))) {
      return res.status(400).json({
        success: false,
        message: "Nieprawidłowy status",
        allowed: Array.from(allowedStatuses)
      });
    }

    if (order_id != null) {
      const o = await get(`SELECT id FROM orders WHERE id = ?`, [Number(order_id)]);
      if (!o) return res.status(400).json({ success: false, message: "Nie istnieje order_id" });
    }

    const existing = await get(`SELECT id FROM appointments WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Appointment not found" });

    const fields: string[] = [];
    const params: any[] = [];

    if (title != null) {
      fields.push("title = ?");
      params.push(String(title));
    }
    if (start_at != null) {
      fields.push("start_at = ?");
      params.push(start_at);
    }
    if (end_at != null) {
      fields.push("end_at = ?");
      params.push(end_at);
    }
    if (status != null) {
      fields.push("status = ?");
      params.push(String(status));
    }
    if (notes != null) {
      fields.push("notes = ?");
      params.push(notes);
    }
    if (order_id != null) {
      fields.push("order_id = ?");
      params.push(order_id);
    }

    params.push(id);

    await run(`UPDATE appointments SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await get(`SELECT * FROM appointments WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function deleteAppointment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Nieprawidłowe id" });
    }

    const existing = await get(`SELECT id FROM appointments WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Appointment not found" });

    await run(`DELETE FROM appointments WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


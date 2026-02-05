import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

const allowedStatuses = new Set(["nowe", "w_trakcie", "zakonczone", "anulowane"]);

function getRole(req: AuthRequest) {
  return String(req.user?.rola ?? "user").toLowerCase();
}

function canSeeAll(req: AuthRequest) {
  const role = getRole(req);
  return role === "admin" || role === "kierownik" || role === "recepcja";
}

function canEditAll(req: AuthRequest) {
  const role = getRole(req);
  return role === "admin" || role === "kierownik" || role === "recepcja";
}

export async function listOrders(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: "Nieprawidłowe page/limit" });
    }

    const offset = (page - 1) * limit;

    const role = getRole(req);
    const isAdmin = canSeeAll(req);
    const isCustomer = role === "user" || role === "klient";
    const isMechanic = role === "mechanik";
    const customerId = req.user.customer_id;

    let query = `SELECT
      o.id, o.service, o.status, o.opis,
      o.customer_id, o.vehicle_id,
      o.mechanic_user_id, o.created_by_user_id,
      o.start_at, o.end_at, o.created_at,
      c.name as customer_name,
      c.phone as customer_phone,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.year as vehicle_year,
      v.plate as vehicle_plate
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    LEFT JOIN vehicles v ON v.id = o.vehicle_id`;

    let params: any[] = [];

    if (isCustomer && customerId) {
      query += ` WHERE o.customer_id = ?`;
      params = [customerId];
    } else if (isMechanic) {
      query += ` WHERE o.mechanic_user_id = ? OR o.created_by_user_id = ?`;
      params = [req.user.id, req.user.id];
    } else if (!isAdmin) {
      query += ` WHERE o.created_by_user_id = ?`;
      params = [req.user.id];
    }

    query += ` ORDER BY o.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await all(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM orders o`;
    let countParams: any[] = [];
    if (isCustomer && customerId) {
      countQuery += ` WHERE o.customer_id = ?`;
      countParams = [customerId];
    } else if (isMechanic) {
      countQuery += ` WHERE o.mechanic_user_id = ? OR o.created_by_user_id = ?`;
      countParams = [req.user.id, req.user.id];
    } else if (!isAdmin) {
      countQuery += ` WHERE o.created_by_user_id = ?`;
      countParams = [req.user.id];
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

export async function getOrderById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const row = await get<any>(
      `SELECT
        o.id, o.service, o.status, o.opis,
        o.customer_id, o.vehicle_id,
        o.mechanic_user_id, o.created_by_user_id,
        o.start_at, o.end_at, o.created_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.notes as customer_notes,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year,
        v.plate as vehicle_plate,
        v.vin as vehicle_vin
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN vehicles v ON v.id = o.vehicle_id
      WHERE o.id = ?`,
      [id]
    );

    if (!row) return res.status(404).json({ success: false, message: "Order not found" });

    const role = getRole(req);
    const isAdmin = canSeeAll(req);
    const isOwner = row.created_by_user_id === req.user.id;
    const isCustomer = role === "user" || role === "klient" && req.user.customer_id && row.customer_id === req.user.customer_id;
    const isMechanic = role === "mechanik" && row.mechanic_user_id === req.user.id;

    if (!isAdmin && !isOwner && !isCustomer && !isMechanic) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    return res.json({ success: true, message: "OK", data: row });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createOrder(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const { service, opis, customer_id, vehicle_id, mechanic_user_id, start_at, end_at } = req.body ?? {};

    const role = getRole(req);
    if (role !== "admin" && role !== "kierownik" && role !== "recepcja") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    if (!service || !customer_id || !vehicle_id) {
      return res.status(400).json({
        success: false,
        message: "Brak pĂłl: service, customer_id, vehicle_id",
      });
    }


    const customer = await get<{ id: number }>(`SELECT id FROM customers WHERE id = ?`, [Number(customer_id)]);
    if (!customer) return res.status(400).json({ success: false, message: "Nie istnieje customer_id" });

    const vehicle = await get<{ id: number; customer_id: number }>(
      `SELECT id, customer_id FROM vehicles WHERE id = ?`,
      [Number(vehicle_id)]
    );
    if (!vehicle) return res.status(400).json({ success: false, message: "Nie istnieje vehicle_id" });
    if (vehicle.customer_id !== Number(customer_id)) {
      return res.status(400).json({ success: false, message: "Pojazd nie należy do podanego klienta" });
    }

    if (mechanic_user_id != null) {
      const mech = await get<{ id: number }>(`SELECT id FROM users WHERE id = ?`, [Number(mechanic_user_id)]);
      if (!mech) return res.status(400).json({ success: false, message: "Nie istnieje mechanic_user_id" });
    }

    const result = await run(
      `INSERT INTO orders
        (service, status, opis, customer_id, vehicle_id, mechanic_user_id, created_by_user_id, start_at, end_at)
       VALUES
        (?, 'nowe', ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(service),
        opis ?? null,
        Number(customer_id),
        Number(vehicle_id),
        mechanic_user_id ?? null,
        req.user.id,
        start_at ?? null,
        end_at ?? null,
      ]
    );

    const created = await get<any>(`SELECT * FROM orders WHERE id = ?`, [result.lastID]);

    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function updateOrder(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const { status, opis, mechanic_user_id, start_at, end_at } = req.body ?? {};

    if (status == null && opis == null && mechanic_user_id == null && start_at == null && end_at == null) {
      return res.status(400).json({ success: false, message: "Podaj pole do aktualizacji" });
    }

    if (status != null && !allowedStatuses.has(String(status))) {
      return res.status(400).json({
        success: false,
        message: "Nieprawidłowy status",
        allowed: Array.from(allowedStatuses),
      });
    }

    const existing = await get<any>(
      `SELECT id, created_by_user_id FROM orders WHERE id = ?`,
      [id]
    );
    if (!existing) return res.status(404).json({ success: false, message: "Order not found" });

    const role = getRole(req);
    const isAdmin = canEditAll(req);
    const isOwner = existing.created_by_user_id === req.user.id;
    const isMechanic = role === "mechanik";

    if (!isAdmin && !isOwner && !isMechanic) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    if (isMechanic) {
      const assigned = await get<{ id: number }>(
        `SELECT id FROM orders WHERE id = ? AND mechanic_user_id = ?`,
        [id, req.user.id]
      );
      if (!assigned) {
        return res.status(403).json({ success: false, message: "Brak uprawnień" });
      }
    }

    if (mechanic_user_id != null) {
      const mech = await get<{ id: number }>(`SELECT id FROM users WHERE id = ?`, [Number(mechanic_user_id)]);
      if (!mech) return res.status(400).json({ success: false, message: "Nie istnieje mechanic_user_id" });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (status != null) {
      fields.push("status = ?");
      params.push(String(status));
    }
    if (opis != null) {
      fields.push("opis = ?");
      params.push(opis);
    }
    if (mechanic_user_id != null) {
      fields.push("mechanic_user_id = ?");
      params.push(mechanic_user_id);
    }
    if (start_at != null) {
      fields.push("start_at = ?");
      params.push(start_at);
    }
    if (end_at != null) {
      fields.push("end_at = ?");
      params.push(end_at);
    }

    params.push(id);

    await run(`UPDATE orders SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await get<any>(`SELECT * FROM orders WHERE id = ?`, [id]);
    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


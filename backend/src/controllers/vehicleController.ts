import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { normalizeRole } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

export async function listVehicles(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: "Nieprawidłowe page/limit" });
    }

    const offset = (page - 1) * limit;

    const role = normalizeRole(req.user.rola);
    const isViewer = role === "admin" || role === "kierownik" || role === "recepcja" || role === "mechanik" || role === "user" || role === "klient";
    if (!isViewer) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const q = String((req.query.q ?? "") as string).trim();
    const isCustomer = role === "user" || role === "klient";
    let customerId = req.user.customer_id;

    if (isCustomer && !customerId) {
      const row = await get<{ customer_id: number | null }>(
        `SELECT customer_id FROM users WHERE id = ?`,
        [req.user.id]
      );
      customerId = row?.customer_id ?? undefined;
    }

    let query = `SELECT
      v.id, v.customer_id, v.make, v.model, v.year, v.plate, v.vin, v.last_service_at, v.created_at,
      c.name as customer_name, c.phone as customer_phone
     FROM vehicles v
     LEFT JOIN customers c ON c.id = v.customer_id`;

    let params: any[] = [];

    if (isCustomer && !customerId) {
      return res.json({ success: true, message: "OK", data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    if (isCustomer && customerId) {
      query += ` WHERE v.customer_id = ?`;
      params = [customerId];
    }

    if (q) {
      const searchParams = [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`];
      if (params.length > 0) {
        query += ` AND (v.plate LIKE ? OR v.vin LIKE ? OR v.make LIKE ? OR v.model LIKE ? OR c.name LIKE ?)`;
      } else {
        query += ` WHERE (v.plate LIKE ? OR v.vin LIKE ? OR v.make LIKE ? OR v.model LIKE ? OR c.name LIKE ?)`;
      }
      params = params.concat(searchParams);
    }

    query += ` ORDER BY v.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await all(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM vehicles v`;
    let countParams: any[] = [];
    if (isCustomer && customerId) {
      countQuery += ` WHERE v.customer_id = ?`;
      countParams = [customerId];
    }
    if (q) {
      const searchParams = [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`];
      if (countParams.length > 0) {
        countQuery += ` AND (v.plate LIKE ? OR v.vin LIKE ? OR v.make LIKE ? OR v.model LIKE ? OR c.name LIKE ?)`;
      } else {
        countQuery += ` WHERE (v.plate LIKE ? OR v.vin LIKE ? OR v.make LIKE ? OR v.model LIKE ? OR c.name LIKE ?)`;
      }
      countQuery += ` LEFT JOIN customers c ON c.id = v.customer_id`;
      countParams = countParams.concat(searchParams);
    }
    const countRow = await get(countQuery, countParams);
    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return res.json({ success: true, message: "OK", data: rows, pagination: { page, limit, total, totalPages } });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function getVehicleById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    const isViewer = role === "admin" || role === "kierownik" || role === "recepcja" || role === "mechanik" || role === "user" || role === "klient";
    if (!isViewer) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const row = await get(
      `SELECT
        v.id, v.customer_id, v.make, v.model, v.year, v.plate, v.vin, v.last_service_at, v.created_at,
        c.name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM vehicles v
       LEFT JOIN customers c ON c.id = v.customer_id
       WHERE v.id = ?`,
      [id]
    );

    if (!row) return res.status(404).json({ success: false, message: "Vehicle not found" });

    if (role === "user" || role === "klient") {
      let customerId = req.user.customer_id;
      if (!customerId) {
        const userRow = await get<{ customer_id: number | null }>(
          `SELECT customer_id FROM users WHERE id = ?`,
          [req.user.id]
        );
        customerId = userRow?.customer_id ?? undefined;
      }
      if (!customerId || row?.customer_id !== customerId) {
        return res.status(403).json({ success: false, message: "Brak uprawnień" });
      }
    }

    return res.json({ success: true, message: "OK", data: row });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createVehicle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    const isCustomer = role === "user" || role === "klient";
    if (!isCustomer && role !== "admin" && role !== "kierownik" && role !== "recepcja") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const { customer_id, make, model, year, plate, vin, last_service_at } = req.body ?? {};

    let effectiveCustomerId = isCustomer ? req.user.customer_id : customer_id;
    if (isCustomer && !effectiveCustomerId) {
      const userRow = await get<{ id: number; imie: string; nazwisko: string; mail: string; telefon: string | null }>(
        `SELECT id, imie, nazwisko, mail, telefon FROM users WHERE id = ?`,
        [req.user.id]
      );

      if (!userRow) return res.status(400).json({ success: false, message: "Brak danych użytkownika" });

      const customerRes = await run(
        `INSERT INTO customers (name, email, phone, notes) VALUES (?, ?, ?, ?)`
        ,
        [`${userRow.imie ?? ''} ${userRow.nazwisko ?? ''}`.trim(), userRow.mail, userRow.telefon ?? null, null]
      );

      await run(`UPDATE users SET customer_id = ? WHERE id = ?`, [customerRes.lastID, userRow.id]);
      effectiveCustomerId = customerRes.lastID;
    }

    if (!effectiveCustomerId) {
      return res.status(400).json({ success: false, message: "Brak customer_id" });
    }

    if (!make || !model || !plate) {
      return res.status(400).json({
        success: false,
        message: "Brak pól: make, model, plate"
      });
    }

    const cust = await get<{ id: number }>(`SELECT id FROM customers WHERE id = ?`, [Number(effectiveCustomerId)]);
    if (!cust) return res.status(400).json({ success: false, message: "Nie istnieje customer_id" });

    const existingPlate = await get<{ id: number }>(`SELECT id FROM vehicles WHERE plate = ?`, [String(plate)]);
    if (existingPlate) return res.status(409).json({ success: false, message: "Pojazd o takiej rejestracji już istnieje" });

    const result = await run(
      `INSERT INTO vehicles (customer_id, make, model, year, plate, vin, last_service_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(effectiveCustomerId),
        String(make),
        String(model),
        year ?? null,
        String(plate),
        vin ?? null,
        last_service_at ?? null
      ]
    );

    const created = await get(`SELECT * FROM vehicles WHERE id = ?`, [result.lastID]);

    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    const msg = String(e?.message || "DB error");
    if (msg.includes("UNIQUE constraint failed: vehicles.plate")) {
      return res.status(409).json({ success: false, message: "Pojazd o takiej rejestracji juĹĽ istnieje" });
    }
    return res.status(500).json({ success: false, message: msg });
  }
}

export async function updateVehicle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (role !== "admin" && role !== "kierownik" && role !== "recepcja") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const { customer_id, make, model, year, plate, vin, last_service_at } = req.body ?? {};

    if (
      customer_id == null &&
      make == null &&
      model == null &&
      year == null &&
      plate == null &&
      vin == null &&
      last_service_at == null
    ) {
      return res.status(400).json({ success: false, message: "Podaj pole do aktualizacji" });
    }

    const existing = await get<{ id: number }>(`SELECT id FROM vehicles WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Vehicle not found" });

    if (customer_id != null) {
      const cust = await get<{ id: number }>(`SELECT id FROM customers WHERE id = ?`, [Number(customer_id)]);
      if (!cust) return res.status(400).json({ success: false, message: "Nie istnieje customer_id" });
    }

    if (plate != null) {
      const dup = await get<{ id: number }>(`SELECT id FROM vehicles WHERE plate = ? AND id != ?`, [String(plate), id]);
      if (dup) return res.status(409).json({ success: false, message: "Pojazd o takiej rejestracji już istnieje" });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (customer_id != null) {
      fields.push("customer_id = ?");
      params.push(Number(customer_id));
    }
    if (make != null) {
      fields.push("make = ?");
      params.push(String(make));
    }
    if (model != null) {
      fields.push("model = ?");
      params.push(String(model));
    }
    if (year != null) {
      fields.push("year = ?");
      params.push(year);
    }
    if (plate != null) {
      fields.push("plate = ?");
      params.push(String(plate));
    }
    if (vin != null) {
      fields.push("vin = ?");
      params.push(vin);
    }
    if (last_service_at != null) {
      fields.push("last_service_at = ?");
      params.push(last_service_at);
    }

    params.push(id);

    await run(`UPDATE vehicles SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await get(`SELECT * FROM vehicles WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    const msg = String(e?.message || "DB error");
    if (msg.includes("UNIQUE constraint failed: vehicles.plate")) {
      return res.status(409).json({ success: false, message: "Pojazd o takiej rejestracji już istnieje" });
    }
    return res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteVehicle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (role !== "admin" && role !== "kierownik") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const existing = await get<{ id: number }>(`SELECT id FROM vehicles WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Vehicle not found" });

    await run(`DELETE FROM vehicles WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


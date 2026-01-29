import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { normalizeRole } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

function canViewAll(role: string) {
  return role === "admin" || role === "kierownik" || role === "recepcja";
}

function canManageAll(role: string) {
  return role === "admin" || role === "kierownik" || role === "recepcja";
}

export async function listSchedule(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    const userId = Number(req.user.id);
    const qUserId = Number(req.query.user_id);

    if (canViewAll(role)) {
      const target = Number.isFinite(qUserId) ? qUserId : null;
      const rows = target
        ? await all(`SELECT * FROM employee_schedule WHERE user_id = ? ORDER BY id DESC`, [target])
        : await all(`SELECT * FROM employee_schedule ORDER BY id DESC`);
      return res.json({ success: true, message: "OK", data: rows });
    }

    if (role === "mechanik") {
      const rows = await all(`SELECT * FROM employee_schedule WHERE user_id = ? ORDER BY id DESC`, [userId]);
      return res.json({ success: true, message: "OK", data: rows });
    }

    return res.status(403).json({ success: false, message: "Brak uprawnień" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createSchedule(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);

    const { user_id, day_of_week, start_time, end_time, is_available } = req.body ?? {};
    if (!user_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: "Brak pól: user_id, day_of_week, start_time, end_time" });
    }

    if (role === "mechanik" && Number(user_id) !== req.user.id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    if (!canManageAll(role) && role !== "mechanik") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const u = await get<{ id: number }>(`SELECT id FROM users WHERE id = ?`, [Number(user_id)]);
    if (!u) return res.status(400).json({ success: false, message: "Nie istnieje user_id" });

    const result = await run(
      `INSERT INTO employee_schedule (user_id, day_of_week, start_time, end_time, is_available)
       VALUES (?, ?, ?, ?, ?)` ,
      [Number(user_id), String(day_of_week), String(start_time), String(end_time), is_available ?? 1]
    );

    const created = await get(`SELECT * FROM employee_schedule WHERE id = ?`, [result.lastID]);
    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function updateSchedule(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const { day_of_week, start_time, end_time, is_available } = req.body ?? {};
    if (day_of_week == null && start_time == null && end_time == null && is_available == null) {
      return res.status(400).json({ success: false, message: "Podaj pole do aktualizacji" });
    }

    const existing = await get<{ id: number; user_id: number }>(`SELECT id, user_id FROM employee_schedule WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Schedule not found" });

    if (role === "mechanik" && existing.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    if (!canManageAll(role) && role !== "mechanik") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (day_of_week != null) { fields.push("day_of_week = ?"); params.push(String(day_of_week)); }
    if (start_time != null) { fields.push("start_time = ?"); params.push(String(start_time)); }
    if (end_time != null) { fields.push("end_time = ?"); params.push(String(end_time)); }
    if (is_available != null) { fields.push("is_available = ?"); params.push(is_available ? 1 : 0); }

    params.push(id);

    await run(`UPDATE employee_schedule SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await get(`SELECT * FROM employee_schedule WHERE id = ?`, [id]);
    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function deleteSchedule(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const existing = await get<{ id: number; user_id: number }>(`SELECT id, user_id FROM employee_schedule WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Schedule not found" });

    if (role === "mechanik" && existing.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    if (!canManageAll(role) && role !== "mechanik") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    await run(`DELETE FROM employee_schedule WHERE id = ?`, [id]);
    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

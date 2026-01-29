import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

export async function listNotifications(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const rows = await all(
      `SELECT id, user_id, title, body, read_at, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 100`,
      [req.user.id]
    );

    return res.json({ success: true, message: "OK", data: rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function getNotificationById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const row = await get(
      `SELECT id, user_id, title, body, read_at, created_at
       FROM notifications
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (!row) return res.status(404).json({ success: false, message: "Notification not found" });

    return res.json({ success: true, message: "OK", data: row });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createNotification(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });


    if (req.user.rola !== "admin") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const { user_id, title, body } = req.body ?? {};
    if (!user_id || !title) {
      return res.status(400).json({ success: false, message: "Brak pĂłl: user_id, title" });
    }

    const u = await get<{ id: number }>(`SELECT id FROM users WHERE id = ?`, [Number(user_id)]);
    if (!u) return res.status(400).json({ success: false, message: "Nie istnieje user_id" });

    const result = await run(
      `INSERT INTO notifications (user_id, title, body)
       VALUES (?, ?, ?)`,
      [Number(user_id), String(title), body ?? null]
    );

    const created = await get(`SELECT * FROM notifications WHERE id = ?`, [result.lastID]);

    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function markRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const existing = await get<{ id: number }>(
      `SELECT id FROM notifications WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    if (!existing) return res.status(404).json({ success: false, message: "Notification not found" });

    await run(
      `UPDATE notifications
       SET read_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    const updated = await get(`SELECT * FROM notifications WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function markAllRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    await run(
      `UPDATE notifications
       SET read_at = datetime('now')
       WHERE user_id = ? AND read_at IS NULL`,
      [req.user.id]
    );

    return res.json({ success: true, message: "Updated" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function deleteNotification(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const existing = await get<{ id: number }>(
      `SELECT id FROM notifications WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    if (!existing) return res.status(404).json({ success: false, message: "Notification not found" });

    await run(`DELETE FROM notifications WHERE id = ? AND user_id = ?`, [id, req.user.id]);

    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


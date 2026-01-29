import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { normalizeRole } from "../middleware/auth.js";
import { all } from "../db.js";

export async function listAnalytics(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

    const role = normalizeRole(req.user.rola);
    if (role !== "admin" && role !== "kierownik") {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();

    let query = `SELECT * FROM analytics`;
    const params: any[] = [];

    if (from && to) {
      query += ` WHERE date BETWEEN ? AND ?`;
      params.push(from, to);
    } else if (from) {
      query += ` WHERE date >= ?`;
      params.push(from);
    } else if (to) {
      query += ` WHERE date <= ?`;
      params.push(to);
    }

    query += ` ORDER BY date DESC`;

    const rows = await all(query, params);
    return res.json({ success: true, message: "OK", data: rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

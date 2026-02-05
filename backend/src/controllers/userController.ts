import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { all } from "../db.js";

function canListMechanics(req: AuthRequest) {
  const role = String(req.user?.rola ?? "").toLowerCase();
  return role === "admin" || role === "kierownik" || role === "recepcja";
}

export async function listMechanics(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });
    if (!canListMechanics(req)) return res.status(403).json({ success: false, message: "Brak uprawnień" });

    const rows = await all(
      `SELECT id, imie, nazwisko, mail, telefon, rola, status, last_login_at, created_at
       FROM users
       WHERE lower(rola) IN ('mechanik', 'mechanic')
       ORDER BY nazwisko ASC, imie ASC, id ASC`
    );

    return res.json({ success: true, message: "OK", data: rows || [] });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

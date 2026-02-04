import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { normalizeRole } from "../middleware/auth.js";
import { get } from "../db.js";

export async function getProfile(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });

  const user = await get(
    `SELECT id, imie, nazwisko, mail, telefon, rola, customer_id, created_at
     FROM users
     WHERE id = ?`,
    [req.user.id]
  );

  if (!user) return res.status(404).json({ success: false, message: "Not found" });

  res.json({
    success: true,
    message: "OK",
    data: { ...user, rola: normalizeRole(String((user as any).rola)) },
  });
}


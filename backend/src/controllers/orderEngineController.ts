import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { ENGINE_MODEL_KEY, ENGINE_PARTS } from "../config/engineParts.js";
import { createEngineEntry, getEngineEntries } from "../services/orderEngineService.js";
import { validateEngineEntry } from "../validators/engineEntryValidator.js";
import { get } from "../db.js";

export function listEngineParts(_req: AuthRequest, res: Response) {
  return res.json({ success: true, message: "OK", data: { model_key: ENGINE_MODEL_KEY, parts: ENGINE_PARTS.map(({ key, label }) => ({ key, label })), limits: { description_max: 2000, comment_max: 500, parts_max: 30 } } });
}

export async function readOrderEngineEntries(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });
  const order = await get<any>(`SELECT customer_id, mechanic_user_id, status FROM orders WHERE id = ?`, [orderId]);
  if (!order) return res.status(404).json({ success: false, message: "Nie znaleziono zlecenia" });
  const role = String(req.user.rola).toLowerCase();
  const allowed = ["admin", "kierownik", "recepcja"].includes(role) || ((role === "klient" || role === "user") && req.user.customer_id === order.customer_id) || (role === "mechanik" && req.user.id === order.mechanic_user_id);
  if (!allowed) return res.status(403).json({ success: false, message: "Brak uprawnień" });
  return res.json({ success: true, message: "OK", data: await getEngineEntries(orderId) });
}

export async function writeOrderEngineEntry(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: "Brak autoryzacji" });
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });
  const validation = validateEngineEntry(req.body);
  if (validation.error || !validation.input) return res.status(400).json({ success: false, message: validation.error });
  try {
    const data = await createEngineEntry(orderId, req.user, validation.input);
    return res.status(201).json({ success: true, message: "Zapisano wpis", data });
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({ success: false, message: error?.statusCode ? error.message : "Nie udało się zapisać wpisu" });
  }
}
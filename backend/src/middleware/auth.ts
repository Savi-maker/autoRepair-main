import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export type AuthUser = {
  id: number;
  mail: string;
  rola: string;
  customer_id?: number;
};

export type AuthRequest = Request & { user?: AuthUser };

export function normalizeRole(role?: string): string {
  const r = String(role ?? "").trim().toLowerCase();
  if (r === "admin" || r === "administrator") return "admin";
  if (r === "kierownik" || r === "manager") return "kierownik";
  if (r === "mechanik" || r === "mechanic") return "mechanik";
  if (r === "recepcja" || r === "receptionist") return "recepcja";
  if (r === "klient" || r === "client") return "klient";
  return "user";
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokenu" });
  }

  const token = header.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Brak JWT_SECRET w .env" });

  try {
    const payload = jwt.verify(token, secret) as AuthUser;
    req.user = { ...payload, rola: normalizeRole(payload.rola) };
    next();
  } catch {
    return res.status(401).json({ error: "Niepoprawny token" });
  }
}


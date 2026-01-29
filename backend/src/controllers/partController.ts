import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { all, get, run } from "../db.js";

export async function listParts(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const q = String((req.query.q ?? "") as string).trim();

    const rows = q
      ? await all(
          `SELECT id, name, sku, brand, stock, min_stock, price, location, created_at
           FROM parts
           WHERE name LIKE ? OR sku LIKE ? OR brand LIKE ? OR location LIKE ?
           ORDER BY id DESC`,
          [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
        )
      : await all(
          `SELECT id, name, sku, brand, stock, min_stock, price, location, created_at
           FROM parts
           ORDER BY id DESC`
        );

    return res.json({ success: true, message: "OK", data: rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function getPartById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const row = await get(
      `SELECT id, name, sku, brand, stock, min_stock, price, location, created_at
       FROM parts
       WHERE id = ?`,
      [id]
    );

    if (!row) return res.status(404).json({ success: false, message: "Part not found" });

    return res.json({ success: true, message: "OK", data: row });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createPart(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const { name, sku, brand, stock, min_stock, price, location } = req.body ?? {};

    if (!name || !sku) {
      return res.status(400).json({ success: false, message: "Brak pĂłl: name, sku" });
    }

    const existing = await get<{ id: number }>(`SELECT id FROM parts WHERE sku = ?`, [String(sku)]);
    if (existing) return res.status(409).json({ success: false, message: "Część o takim SKU już istnieje" });

    const result = await run(
      `INSERT INTO parts (name, sku, brand, stock, min_stock, price, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        String(name),
        String(sku),
        brand ?? null,
        stock ?? 0,
        min_stock ?? 0,
        price ?? 0,
        location ?? null
      ]
    );

    const created = await get(`SELECT * FROM parts WHERE id = ?`, [result.lastID]);

    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    const msg = String(e?.message || "DB error");
    if (msg.includes("UNIQUE constraint failed: parts.sku")) {
      return res.status(409).json({ success: false, message: "CzÄ™Ĺ›Ä‡ o takim SKU juĹĽ istnieje" });
    }
    return res.status(500).json({ success: false, message: msg });
  }
}

export async function updatePart(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const { name, sku, brand, stock, min_stock, price, location } = req.body ?? {};

    if (name == null && sku == null && brand == null && stock == null && min_stock == null && price == null && location == null) {
      return res.status(400).json({ success: false, message: "Podaj pole do aktualizacji" });
    }

    const existing = await get<{ id: number }>(`SELECT id FROM parts WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Part not found" });

    if (sku != null) {
      const dup = await get<{ id: number }>(`SELECT id FROM parts WHERE sku = ? AND id != ?`, [String(sku), id]);
      if (dup) return res.status(409).json({ success: false, message: "Część o takim SKU już istnieje" });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (name != null) {
      fields.push("name = ?");
      params.push(String(name));
    }
    if (sku != null) {
      fields.push("sku = ?");
      params.push(String(sku));
    }
    if (brand != null) {
      fields.push("brand = ?");
      params.push(brand);
    }
    if (stock != null) {
      fields.push("stock = ?");
      params.push(Number(stock));
    }
    if (min_stock != null) {
      fields.push("min_stock = ?");
      params.push(Number(min_stock));
    }
    if (price != null) {
      fields.push("price = ?");
      params.push(Number(price));
    }
    if (location != null) {
      fields.push("location = ?");
      params.push(location);
    }

    params.push(id);

    await run(`UPDATE parts SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await get(`SELECT * FROM parts WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    const msg = String(e?.message || "DB error");
    if (msg.includes("UNIQUE constraint failed: parts.sku")) {
      return res.status(409).json({ success: false, message: "Część o takim SKU już istnieje" });
    }
    return res.status(500).json({ success: false, message: msg });
  }
}

export async function deletePart(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "Nieprawidłowe id" });

    const existing = await get<{ id: number }>(`SELECT id FROM parts WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Part not found" });

    await run(`DELETE FROM parts WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function lowStockParts(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const rows = await all(
      `SELECT id, name, sku, brand, stock, min_stock, price, location, created_at
       FROM parts
       WHERE stock <= min_stock
       ORDER BY (min_stock - stock) DESC, id DESC`
    );

    return res.json({ success: true, message: "OK", data: rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


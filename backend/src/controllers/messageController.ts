import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { all, get, run } from "../db.js";



export async function listThreads(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const q = String((req.query.q ?? "") as string).trim();
    const isCustomer = req.user.rola === "user" || req.user.rola === "klient";
    const customerId = req.user.customer_id;
    const userId = req.user.id;

    if (isCustomer && !customerId) {
      return res.json({ success: true, message: "OK", data: [] });
    }


    let whereClause = "";
    let params: any[] = [];

    if (isCustomer && customerId) {
      whereClause = ` WHERE t.customer_id = ? OR t.created_by_user_id = ?`;
      params = [customerId, userId];
    }

    const searchCondition = q ? ` AND (t.title LIKE ? OR c.name LIKE ?)` : "";
    const searchParams = q ? [`%${q}%`, `%${q}%`] : [];

    if (q && !whereClause) {
      whereClause = ` WHERE (t.title LIKE ? OR c.name LIKE ?)`;
      params = searchParams;
    } else if (q) {
      params = params.concat(searchParams);
    }

    const rows = await all(
      `SELECT
        t.id, t.title, t.customer_id, t.order_id, t.created_by_user_id, t.created_at, t.updated_at,
        c.name AS customer_name,
        o.service AS order_service,
        (
          SELECT m.text FROM messages m
          WHERE m.thread_id = t.id
          ORDER BY m.id DESC
          LIMIT 1
        ) AS last_message_text,
        (
          SELECT m.created_at FROM messages m
          WHERE m.thread_id = t.id
          ORDER BY m.id DESC
          LIMIT 1
        ) AS last_message_at
      FROM message_threads t
      LEFT JOIN customers c ON c.id = t.customer_id
      LEFT JOIN orders o ON o.id = t.order_id
      ${whereClause}${searchCondition}
      ORDER BY COALESCE(last_message_at, t.updated_at) DESC, t.id DESC`,
      params
    );

    return res.json({ success: true, message: "OK", data: rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function getThreadById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const thread = await get(
      `SELECT
        t.id, t.title, t.customer_id, t.order_id, t.created_by_user_id, t.created_at, t.updated_at,
        c.name AS customer_name,
        c.phone AS customer_phone,
        o.service AS order_service,
        o.status AS order_status
      FROM message_threads t
      LEFT JOIN customers c ON c.id = t.customer_id
      LEFT JOIN orders o ON o.id = t.order_id
      WHERE t.id = ?`,
      [id]
    );

    if (!thread) return res.status(404).json({ success: false, message: "Thread not found" });

    if ((req.user.rola === "user" || req.user.rola === "klient") && req.user.customer_id && thread.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    return res.json({ success: true, message: "OK", data: thread });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createThread(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const { title, customer_id, order_id } = req.body ?? {};
    if (!title) return res.status(400).json({ success: false, message: "Brak pola: title" });

    const isCustomer = req.user.rola === "user" || req.user.rola === "klient";
    const effectiveCustomerId = isCustomer ? req.user.customer_id : customer_id;

    if (isCustomer && !effectiveCustomerId) {
      return res.status(400).json({ success: false, message: "Brak customer_id" });
    }

    if (effectiveCustomerId != null) {
      const c = await get(`SELECT id FROM customers WHERE id = ?`, [Number(effectiveCustomerId)]);
      if (!c) return res.status(400).json({ success: false, message: "Nie istnieje customer_id" });
    }

    if (order_id != null) {
      const o = await get(`SELECT id FROM orders WHERE id = ?`, [Number(order_id)]);
      if (!o) return res.status(400).json({ success: false, message: "Nie istnieje order_id" });
    }

    const result = await run(
      `INSERT INTO message_threads (title, customer_id, order_id, created_by_user_id, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [String(title), effectiveCustomerId ?? null, order_id ?? null, req.user.id]
    );

    const created = await get(`SELECT * FROM message_threads WHERE id = ?`, [result.lastID]);

    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function updateThread(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const { title } = req.body ?? {};
    if (title == null) return res.status(400).json({ success: false, message: "Podaj pole: title" });

    const existing = await get<{ id: number; customer_id: number | null }>(
      `SELECT id, customer_id FROM message_threads WHERE id = ?`,
      [id]
    );
    if (!existing) return res.status(404).json({ success: false, message: "Thread not found" });

    if ((req.user.rola === "user" || req.user.rola === "klient") && req.user.customer_id && existing.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    await run(
      `UPDATE message_threads
       SET title = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [String(title), id]
    );

    const updated = await get(`SELECT * FROM message_threads WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Updated", data: updated });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function deleteThread(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "NieprawidĹ‚owe id" });

    const existing = await get<{ id: number; customer_id: number | null }>(
      `SELECT id, customer_id FROM message_threads WHERE id = ?`,
      [id]
    );
    if (!existing) return res.status(404).json({ success: false, message: "Thread not found" });

    if ((req.user.rola === "user" || req.user.rola === "klient") && req.user.customer_id && existing.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    await run(`DELETE FROM message_threads WHERE id = ?`, [id]);

    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}



export async function listMessages(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const threadId = Number(req.params.threadId);
    if (!Number.isFinite(threadId)) {
      return res.status(400).json({ success: false, message: "Nieprawidłowe threadId" });
    }

    const thread = await get<{ id: number; customer_id: number | null }>(
      `SELECT id, customer_id FROM message_threads WHERE id = ?`,
      [threadId]
    );
    if (!thread) return res.status(404).json({ success: false, message: "Thread not found" });

    if ((req.user.rola === "user" || req.user.rola === "klient") && req.user.customer_id && thread.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const rows = await all(
      `SELECT id, thread_id, sender_user_id, sender_customer_id, text, created_at
       FROM messages
       WHERE thread_id = ?
       ORDER BY id ASC`,
      [threadId]
    );

    return res.json({ success: true, message: "OK", data: rows });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}

export async function createMessage(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });

    const threadId = Number(req.params.threadId);
    if (!Number.isFinite(threadId)) {
      return res.status(400).json({ success: false, message: "NieprawidĹ‚owe threadId" });
    }

    const { text } = req.body ?? {};
    if (!text) return res.status(400).json({ success: false, message: "Brak pola: text" });

    const thread = await get<{ id: number; customer_id: number | null }>(
      `SELECT id, customer_id FROM message_threads WHERE id = ?`,
      [threadId]
    );
    if (!thread) return res.status(404).json({ success: false, message: "Thread not found" });

    if ((req.user.rola === "user" || req.user.rola === "klient") && req.user.customer_id && thread.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: "Brak uprawnień" });
    }

    const result = await run(
      `INSERT INTO messages (thread_id, sender_user_id, sender_customer_id, text)
       VALUES (?, ?, ?, ?)`,
      [threadId, req.user.id, null, String(text)]
    );


    await run(`UPDATE message_threads SET updated_at = datetime('now') WHERE id = ?`, [threadId]);

    const created = await get(
      `SELECT id, thread_id, sender_user_id, sender_customer_id, text, created_at
       FROM messages
       WHERE id = ?`,
      [result.lastID]
    );

    return res.status(201).json({ success: true, message: "Created", data: created });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "DB error" });
  }
}


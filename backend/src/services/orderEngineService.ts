import { all, get, run } from "../db.js";
import type { AuthUser } from "../middleware/auth.js";
import type { CreateEngineEntryInput, EngineEntryKind } from "../types/engineEntry.js";

export async function getEngineEntries(orderId: number) {
  const entries = await all<any>(
    `SELECT e.id, e.order_id, e.kind, e.model_key, e.general_description,
      e.unknown_part, e.revision, e.author_user_id, e.author_role, e.created_at,
      u.imie, u.nazwisko
     FROM order_engine_entries e
     LEFT JOIN users u ON u.id = e.author_user_id
     WHERE e.order_id = ? ORDER BY e.kind, e.revision DESC`,
    [orderId]
  );
  const parts = await all<any>(
    `SELECT p.entry_id, p.part_key, p.comment
     FROM order_engine_entry_parts p
     JOIN order_engine_entries e ON e.id = p.entry_id
     WHERE e.order_id = ? ORDER BY p.part_key`,
    [orderId]
  );
  const withParts = entries.map((entry) => ({
    ...entry,
    unknown_part: Boolean(entry.unknown_part),
    author_name: entry.author_user_id ? `${entry.imie ?? ""} ${entry.nazwisko ?? ""}`.trim() || "Usunięty użytkownik" : "Usunięty użytkownik",
    parts: parts.filter((part) => part.entry_id === entry.id).map(({ part_key, comment }) => ({ part_key, comment })),
  }));
  const latest: Record<EngineEntryKind, any | null> = { customer_report: null, mechanic_diagnosis: null, repair_summary: null };
  for (const entry of withParts) if (!latest[entry.kind as EngineEntryKind]) latest[entry.kind as EngineEntryKind] = entry;
  return { latest, history: withParts };
}

export async function createEngineEntry(orderId: number, user: AuthUser, input: CreateEngineEntryInput) {
  const order = await get<any>(`SELECT id, status, customer_id, mechanic_user_id FROM orders WHERE id = ?`, [orderId]);
  if (!order) throw Object.assign(new Error("Nie znaleziono zlecenia"), { statusCode: 404 });
  if (order.status === "zakonczone" || order.status === "anulowane") throw Object.assign(new Error("Zlecenie jest zamknięte"), { statusCode: 409 });

  const role = String(user.rola).toLowerCase();
  const isStaff = role === "admin" || role === "kierownik" || role === "recepcja";
  const isOwner = (role === "klient" || role === "user") && Boolean(user.customer_id) && Number(user.customer_id) === order.customer_id;
  const isAssignedMechanic = role === "mechanik" && order.mechanic_user_id === user.id;
  if (input.kind === "customer_report" ? !isOwner : !(isStaff || isAssignedMechanic)) {
    throw Object.assign(new Error("Brak uprawnień"), { statusCode: 403 });
  }

  const current = await get<{ revision: number }>(`SELECT MAX(revision) as revision FROM order_engine_entries WHERE order_id = ? AND kind = ?`, [orderId, input.kind]);
  const currentRevision = current?.revision ?? 0;
  if (currentRevision !== input.expected_revision) throw Object.assign(new Error("Wpis został zmieniony. Wczytaj najnowszą wersję."), { statusCode: 409 });

  await run("BEGIN IMMEDIATE");
  try {
    const revision = currentRevision + 1;
    const result = await run(
      `INSERT INTO order_engine_entries (order_id, kind, model_key, general_description, unknown_part, revision, author_user_id, author_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, input.kind, input.model_key, input.general_description, input.unknown_part ? 1 : 0, revision, user.id, role]
    );
    for (const part of input.parts) await run(`INSERT INTO order_engine_entry_parts (entry_id, part_key, comment) VALUES (?, ?, ?)`, [result.lastID, part.part_key, part.comment]);
    await run("COMMIT");
    return getEngineEntry(result.lastID);
  } catch (error) {
    try { await run("ROLLBACK"); } catch { /* preserve original database error */ }
    throw error;
  }
}

async function getEngineEntry(id: number) {
  const data = await getEngineEntriesForId(id);
  return data;
}

async function getEngineEntriesForId(id: number) {
  const entry = await get<any>(`SELECT e.*, u.imie, u.nazwisko FROM order_engine_entries e LEFT JOIN users u ON u.id = e.author_user_id WHERE e.id = ?`, [id]);
  if (!entry) return null;
  const parts = await all<{ part_key: string; comment: string }>(`SELECT part_key, comment FROM order_engine_entry_parts WHERE entry_id = ? ORDER BY part_key`, [id]);
  return { ...entry, unknown_part: Boolean(entry.unknown_part), author_name: entry.author_user_id ? `${entry.imie ?? ""} ${entry.nazwisko ?? ""}`.trim() || "Usunięty użytkownik" : "Usunięty użytkownik", parts };
}
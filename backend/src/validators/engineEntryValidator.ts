import { ENGINE_MODEL_KEY, ENGINE_PART_KEYS } from "../config/engineParts.js";
import type { CreateEngineEntryInput, EngineEntryKind } from "../types/engineEntry.js";

const kinds = new Set<EngineEntryKind>(["customer_report", "mechanic_diagnosis", "repair_summary"]);

export function validateEngineEntry(value: unknown): { input?: CreateEngineEntryInput; error?: string } {
  if (!value || typeof value !== "object") return { error: "Nieprawidłowe dane wpisu" };
  const body = value as Record<string, unknown>;
  const description = body.general_description;
  const parts = body.parts;
  if (!kinds.has(body.kind as EngineEntryKind)) return { error: "Nieprawidłowy rodzaj wpisu" };
  if (body.model_key !== ENGINE_MODEL_KEY) return { error: "Nieznany model silnika" };
  if (typeof description !== "string" || description.trim().length < 5 || description.trim().length > 2000) return { error: "Opis musi mieć od 5 do 2000 znaków" };
  if (typeof body.unknown_part !== "boolean" || !Array.isArray(parts) || parts.length > 30) return { error: "Nieprawidłowa lista podzespołów" };
  if (body.expected_revision == null || !Number.isInteger(body.expected_revision) || Number(body.expected_revision) < 0) return { error: "Nieprawidłowa wersja wpisu" };
  const seen = new Set<string>();
  const normalizedParts: Array<{ part_key: string; comment: string }> = [];
  for (const part of parts) {
    if (!part || typeof part !== "object") return { error: "Nieprawidłowy podzespół" };
    const item = part as Record<string, unknown>;
    if (typeof item.part_key !== "string" || !ENGINE_PART_KEYS.has(item.part_key) || seen.has(item.part_key)) return { error: "Nieznany lub powtórzony podzespół" };
    if (typeof item.comment !== "string" || item.comment.length > 500) return { error: "Komentarz do podzespołu jest za długi" };
    seen.add(item.part_key);
    normalizedParts.push({ part_key: item.part_key, comment: item.comment });
  }
  if (body.unknown_part !== (normalizedParts.length === 0)) return { error: "Wybór podzespołów jest niespójny" };
  return { input: { model_key: ENGINE_MODEL_KEY, kind: body.kind as EngineEntryKind, general_description: description.trim(), unknown_part: body.unknown_part, parts: normalizedParts, expected_revision: Number(body.expected_revision) } };
}
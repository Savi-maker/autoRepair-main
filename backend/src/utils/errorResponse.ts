import type { Response } from "express";

type ErrorPayload = {
  code?: string;
  details?: unknown;
  stack?: string;
};

export function sendError(
  res: Response,
  status: number,
  message: string,
  payload: ErrorPayload = {}
) {
  return res.status(status).json({
    success: false,
    message,
    error: payload.code || "REQUEST_ERROR",
    ...payload,
  });
}

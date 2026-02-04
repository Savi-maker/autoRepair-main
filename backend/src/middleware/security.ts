import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'

type AuthPayload = {
  id: number;
  mail: string;
  rola: string;
  customer_id?: number;
};


function normalizeRole(role?: string): string {
  const r = String(role ?? "").trim().toLowerCase();
  if (r === "admin" || r === "administrator") return "admin";
  if (r === "kierownik" || r === "manager") return "kierownik";
  if (r === "mechanik" || r === "mechanic") return "mechanik";
  if (r === "recepcja" || r === "receptionist") return "recepcja";
  if (r === "klient" || r === "client") return "klient";
  return "user";
}


function isAdminRequest(req: Request): boolean {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return false;
    
    const token = header.slice("Bearer ".length);
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;
    
    const payload = jwt.verify(token, secret) as AuthPayload;
    return normalizeRole(payload.rola) === "admin";
  } catch {
    return false;
  }
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: 'Zbyt wiele żądań z tego adresu IP, spróbuj ponownie później.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isAdminRequest(req),
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Zbyt wiele prób logowania, spróbuj ponownie za 15 minut.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: 'Zbyt wiele żądań do tego endpointu, spróbuj ponownie później.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isAdminRequest(req),
})

export function helmetMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:*', 'https://localhost:*'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
}

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/<[^>]*>/g, '')
          .trim()
          .slice(0, 500)
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize)
      }
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {}
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sanitized[key] = sanitize(obj[key])
          }
        }
        return sanitized
      }
      return obj
    }
    req.body = sanitize(req.body)
  }
  next()
}

export function validateContentType(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
    const contentType = req.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type musi być application/json',
      })
    }
  }
  next()
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err)

  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: err.message || 'Zbyt wiele żądań, spróbuj ponownie później.',
    })
  }

  const statusCode = err.status || err.statusCode || 500
  const message = err.message || 'Wewnętrzny błąd serwera'

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

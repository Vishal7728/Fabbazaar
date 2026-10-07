import type { RequestHandler } from 'express';

type RateLimitEntry = { count: number; resetAt: number };

const authenticationAttempts = new Map<string, RateLimitEntry>();
const supportAttempts = new Map<string, RateLimitEntry>();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 10;

export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.set({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer'
  });
  next();
};

export const authenticationRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  if (authenticationAttempts.size > 10_000) {
    for (const [key, entry] of authenticationAttempts) {
      if (entry.resetAt <= now) authenticationAttempts.delete(key);
    }
  }

  const key = `${req.ip}:${req.path}`;
  const current = authenticationAttempts.get(key);
  if (!current || current.resetAt <= now) {
    authenticationAttempts.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return next();
  }
  if (current.count >= AUTH_MAX_ATTEMPTS) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Too many authentication attempts. Try again later.' });
  }
  current.count += 1;
  return next();
};

export const supportRequestRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const current = supportAttempts.get(key);
  if (!current || current.resetAt <= now) {
    supportAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return next();
  }
  if (current.count >= 5) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Too many support requests. Please try again later.' });
  }
  current.count += 1;
  return next();
};

export function allowedOrigins(): Set<string> {
  const configured = process.env.FRONTEND_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (configured?.length) return new Set(configured);
  if (process.env.NODE_ENV === 'production') return new Set();
  return new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);
}

export function isLocalDevelopmentOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' || url.port !== '3000' || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return true;
    const octets = host.split('.').map(Number);
    if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
    return octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168);
  } catch {
    return false;
  }
}


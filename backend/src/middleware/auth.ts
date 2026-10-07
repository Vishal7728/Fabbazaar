import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer';
import { findUserById } from '../lib/store';

export type AuthAccount = {
  id: string;
  customerId?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  status?: 'active' | 'deactivated';
};

export function jwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET;
  if (!configuredSecret) {
    if (process.env.NODE_ENV === 'test') return 'development-secret';
    if (process.env.NODE_ENV === 'development') return 'development-secret';
    throw new Error('Set JWT_SECRET to a private value of at least 32 characters.');
  }
  if (process.env.NODE_ENV !== 'test' && configuredSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters.');
  }
  return configuredSecret;
}

export function asyncHandler(handler: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('authorization');
  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  let subject: string;
  let authVersion: number | undefined;
  try {
    const payload = jwt.verify(token, jwtSecret());
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    subject = payload.sub;
    authVersion = typeof payload.authVersion === 'number' ? payload.authVersion : undefined;
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }

  if (process.env.NODE_ENV === 'test') {
    const account = findUserById(subject);
    if (!account || account.status === 'deactivated') return res.status(401).json({ error: 'Account unavailable' });
    if (authVersion !== (account.authVersion ?? 0)) {
      return res.status(401).json({ error: 'Session expired. Sign in again.' });
    }
    res.locals.account = account as AuthAccount;
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Account storage is unavailable' });
  }

  try {
    const account = await Customer.findById(subject).select('customerId name email phone role status authVersion');
    if (!account || account.get('status') !== 'active') return res.status(401).json({ error: 'Account unavailable' });
    if (authVersion !== (account.get('authVersion') as number ?? 0)) {
      return res.status(401).json({ error: 'Session expired. Sign in again.' });
    }
    res.locals.account = {
      id: account.id,
      customerId: account.get('customerId'),
      name: account.get('name'),
      email: account.get('email'),
      phone: account.get('phone'),
      role: account.get('role'),
      status: account.get('status')
    } satisfies AuthAccount;
    return next();
  } catch (error) {
    console.error('Failed to verify account session', error);
    return res.status(500).json({ error: 'Unable to verify account session' });
  }
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  const account = res.locals.account as AuthAccount | undefined;
  if (account?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
  return next();
}

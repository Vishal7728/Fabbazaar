import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import express, { Router } from 'express';
import { asyncHandler, requireAdmin, requireAuth } from '../middleware/auth';
import { uploadsDirectory } from '../lib/uploads';

const router = Router();
const allowed = new Map<string, { extension: string; signature: (data: Buffer) => boolean }>([
  ['image/jpeg', { extension: '.jpg', signature: (data) => data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff }],
  ['image/png', { extension: '.png', signature: (data) => data.length > 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ['image/webp', { extension: '.webp', signature: (data) => data.length > 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' }],
  ['image/avif', { extension: '.avif', signature: (data) => data.length > 12 && data.toString('ascii', 4, 12).includes('ftypavif') }]
]);

router.post('/', requireAuth, requireAdmin, express.raw({ type: [...allowed.keys()], limit: '10mb' }), asyncHandler(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Choose an image to upload.' });
  const mime = req.header('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
  const format = allowed.get(mime);
  if (!format || !format.signature(req.body)) return res.status(415).json({ error: 'Upload a valid JPEG, PNG, WebP, or AVIF image.' });
  const filename = `${randomUUID()}${format.extension}`;
  await mkdir(uploadsDirectory, { recursive: true });
  await writeFile(resolve(uploadsDirectory, filename), req.body, { flag: 'wx', mode: 0o644 });
  return res.status(201).json({ data: { path: `/uploads/${filename}`, size: req.body.length, mimeType: mime } });
}));

export default router;

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from './app';
import { provisionAdminAccount } from './routes/auth';
import { Customer } from './models/Customer';
import { canChangeFulfillment } from './lib/order-state';

describe('FabBazaar API', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.app).toBe('FabBazaar API');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rejects malformed JSON and does not grant CORS to arbitrary sites', async () => {
    const malformedBody = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(malformedBody.status).toBe(400);
    expect(malformedBody.body.error).toBe('Malformed request body');

    const disallowedOrigin = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example');
    expect(disallowedOrigin.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('invalidates existing access tokens after a password change', async () => {
    const email = `password-change-${Date.now()}@example.com`;
    const registration = await request(app).post('/api/auth/register').send({
      name: 'Password Change',
      email,
      password: 'original-password',
      phone: '+919876543210'
    });
    expect(registration.status).toBe(201);

    const changed = await request(app)
      .post('/api/auth/me/password')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({ currentPassword: 'original-password', newPassword: 'updated-password' });
    expect(changed.status).toBe(204);

    const staleSession = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registration.body.token}`);
    expect(staleSession.status).toBe(401);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'updated-password' });
    expect(login.status).toBe(200);
    const currentSession = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(currentSession.status).toBe(200);
  });

  it('returns products list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('does not expose the retired shared in-memory cart API', async () => {
    const response = await request(app).get('/api/cart');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Route not found');
  });

  it('protects the support inbox and upload endpoint and validates promotion input', async () => {
    expect((await request(app).get('/api/support/tickets')).status).toBe(401);
    expect((await request(app).patch('/api/support/tickets/FBZ-SUP-TEST').send({ status: 'resolved' })).status).toBe(401);
    expect((await request(app).post('/api/admin/uploads').set('Content-Type', 'image/jpeg').send(Buffer.from([0, 0, 0]))).status).toBe(401);
    expect((await request(app).post('/api/promotions/validate').send({ code: '', subtotal: -1 })).status).toBe(400);
    expect((await request(app).post('/api/support/tickets').send({ name: 'Test Customer', email: 'not-an-email', topic: 'other', message: 'This is a test request.' })).status).toBe(400);
  });

  it('allows a configured administrator without a customer phone number', () => {
    const admin = new Customer({
      name: 'FabBazaar Administrator',
      email: 'admin@example.com',
      passwordHash: 'hashed-password',
      role: 'admin'
    });
    expect(admin.validateSync()).toBeUndefined();
    expect(admin.get('phone')).toBe('');
  });

  it('enforces paid-order fulfillment transitions', () => {
    expect(canChangeFulfillment('pending', 'processing', 'paid')).toBe(true);
    expect(canChangeFulfillment('pending', 'processing', 'pending')).toBe(false);
    expect(canChangeFulfillment('dispatched', 'delivered', 'paid')).toBe(true);
    expect(canChangeFulfillment('delivered', 'dispatched', 'paid')).toBe(false);
    expect(canChangeFulfillment('processing', 'cancelled', 'paid')).toBe(false);
  });

  it('validates registration data and protects private account endpoints', async () => {
    const invalidRegistration = await request(app).post('/api/auth/register').send({
      name: 'A Customer',
      email: 'customer@example.com',
      password: 'customer-password',
      phone: '123'
    });
    expect(invalidRegistration.status).toBe(400);

    const privateProfile = await request(app).get('/api/auth/me');
    expect(privateProfile.status).toBe(401);
    expect((await request(app).get('/api/orders')).status).toBe(401);
    expect((await request(app).post('/api/payments/create-order')).status).toBe(401);

    const paymentConfig = await request(app).get('/api/payments/config');
    expect(paymentConfig.status).toBe(200);
    expect(paymentConfig.body.mode).toBe('test');
    expect(paymentConfig.body.enabled).toBe(false);
  });

  it('keeps public registrations in the customer role and provisions admins from server configuration', async () => {
    const customerEmail = `customer-${Date.now()}@example.com`;
    const registration = await request(app).post('/api/auth/register').send({
      name: 'Store Customer',
      email: customerEmail,
      password: 'customer-password',
      phone: '+919876543210',
      role: 'admin'
    });

    expect(registration.status).toBe(201);
    expect(registration.body.user.role).toBe('customer');
    expect(registration.body.user.customerId).toMatch(/^FBZ-CUS-\d{6}$/);
    expect(registration.body.user.phone).toBe('+919876543210');
    expect(registration.body.user.passwordHash).toBeUndefined();

    const duplicate = await request(app).post('/api/auth/register').send({
      name: 'Another Customer',
      email: customerEmail.toUpperCase(),
      password: 'customer-password',
      phone: '+919876543210'
    });
    expect(duplicate.status).toBe(409);

    const profile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registration.body.token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.user.customerId).toBe(registration.body.user.customerId);
    expect(profile.body.user.passwordHash).toBeUndefined();

    const update = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({ name: 'Updated Customer', role: 'admin', customerId: 'FBZ-CUS-999999' });
    expect(update.status).toBe(200);
    expect(update.body.user.name).toBe('Updated Customer');
    expect(update.body.user.role).toBe('customer');
    expect(update.body.user.customerId).toBe(registration.body.user.customerId);

    const firstAddress = await request(app)
      .post('/api/auth/me/addresses')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({
        label: 'Home',
        fullName: 'Updated Customer',
        phone: '+919876543210',
        line1: '12 Saffron Lane',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
        country: 'India'
      });
    expect(firstAddress.status).toBe(201);
    expect(firstAddress.body.data.isDefault).toBe(true);

    const addresses = await request(app)
      .get('/api/auth/me/addresses')
      .set('Authorization', `Bearer ${registration.body.token}`);
    expect(addresses.status).toBe(200);
    expect(addresses.body.data).toHaveLength(1);

    process.env.ADMIN_EMAIL = `admin-${Date.now()}@example.com`;
    process.env.ADMIN_PASSWORD = 'test-admin-password-123';
    try {
      await provisionAdminAccount();
      const login = await request(app).post('/api/auth/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });

      expect(login.status).toBe(200);
      expect(login.body.user.role).toBe('admin');
      expect(typeof login.body.token).toBe('string');
    } finally {
      delete process.env.ADMIN_EMAIL;
      delete process.env.ADMIN_PASSWORD;
    }
  });
});

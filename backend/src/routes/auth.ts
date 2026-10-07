import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { addUser, findUserByEmail, findUserById, getProducts, nextTestCustomerId } from '../lib/store';
import { Customer, CustomerAddress, nextCustomerId } from '../models/Customer';
import { asyncHandler, AuthAccount, jwtSecret, requireAuth } from '../middleware/auth';

const router = Router();
const dummyPasswordHash = '$2a$12$hCyhmazzCtyeJGi5YpotruHWTQq.WmWGKFrklxxPtx5d70UpK3YNq';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number'),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(128)
});

const profileSchema = z.object({ name: z.string().trim().min(2).max(100) });
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
});
const wishlistSchema = z.object({
  productIds: z.array(z.string().min(1).max(160)).max(200)
});
const addressSchema = z.object({
  label: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().min(4).max(12),
  country: z.string().trim().min(2).max(80),
  isDefault: z.boolean().optional()
});

type CustomerAddressDocument = CustomerAddress & {
  _id: { toString: () => string };
  toObject: () => Record<string, unknown>;
};

function serializeAddress(address: CustomerAddressDocument) {
  const { _id, ...fields } = address.toObject();
  return { ...fields, id: address._id.toString() };
}

function createToken(user: { id: string; authVersion?: number }) {
  return jwt.sign({ sub: user.id, authVersion: user.authVersion ?? 0 }, jwtSecret(), { expiresIn: '1h' });
}

function safeUser(user: {
  id: string;
  customerId?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
}) {
  return {
    id: user.id,
    customerId: user.customerId,
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    role: user.role
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export async function provisionAdminAccount() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email && !password) return;
  if (!email || !password || password.length < 12) {
    throw new Error('Configure both ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.');
  }

  if (process.env.NODE_ENV === 'test') {
    const existing = findUserByEmail(email);
    if (existing) {
      if (existing.role !== 'admin') {
        throw new Error('ADMIN_EMAIL is already registered as a customer. Use a dedicated administrator email.');
      }
      return;
    }

    addUser({
      id: `admin-${Date.now()}`,
      name: 'FabBazaar Administrator',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
      status: 'active'
    });
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB must be connected before provisioning the administrator account.');
  }
  await Customer.init();
  const existing = await Customer.findOne({ email });
  if (existing) {
    if (existing.get('role') !== 'admin') {
      throw new Error('ADMIN_EMAIL is already registered as a customer. Use a dedicated administrator email.');
    }
    return;
  }

  await Customer.create({
    name: 'FabBazaar Administrator',
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'admin',
    status: 'active'
  });
}

router.post('/register', asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  if (process.env.NODE_ENV === 'test') {
    if (findUserByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists' });
    const customerId = nextTestCustomerId();
    const user = addUser({
      id: `test-${customerId}`,
      customerId,
      name: payload.name,
      email,
      phone: payload.phone,
      passwordHash: await bcrypt.hash(payload.password, 12),
      role: 'customer',
      status: 'active',
      isEmailVerified: false,
      createdAt: new Date(),
      lastLoginAt: null
    });
    const token = createToken(user);
    return res.status(201).json({ token, user: safeUser(user) });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Customer database is unavailable. Please try again later.' });
  }

  try {
    await Customer.init();
    if (await Customer.exists({ email })) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const customerId = await nextCustomerId();
    const customer = await Customer.create({
      customerId,
      name: payload.name,
      email,
      phone: payload.phone,
      passwordHash: await bcrypt.hash(payload.password, 12),
      role: 'customer'
    });
    const user = {
      id: customer.id,
      customerId: customer.get('customerId') as string,
      name: customer.get('name') as string,
      email: customer.get('email') as string,
      phone: customer.get('phone') as string,
      role: 'customer' as const
    };
    const token = createToken(user);
    return res.status(201).json({ token, user: safeUser(user) });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    console.error('Customer registration failed', error);
    return res.status(500).json({ error: 'Unable to create the customer account' });
  }
}));

router.post('/login', asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  if (process.env.NODE_ENV === 'test') {
    const account = findUserByEmail(email);
    const validPassword = await bcrypt.compare(payload.password, account?.passwordHash ?? dummyPasswordHash);
    if (!account || account.status === 'deactivated' || !validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    account.lastLoginAt = new Date();
    return res.json({ token: createToken(account), user: safeUser(account) });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Customer database is unavailable. Please try again later.' });
  }

  try {
    const account = await Customer.findOne({ email }).select('+passwordHash');
    if (!account) {
      await bcrypt.compare(payload.password, dummyPasswordHash);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (account.get('status') !== 'active') {
      await bcrypt.compare(payload.password, account.get('passwordHash') as string);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(payload.password, account.get('passwordHash') as string);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    account.set('lastLoginAt', new Date());
    await account.save();
    const user = {
      id: account.id,
      customerId: account.get('customerId') as string | undefined,
      name: account.get('name') as string,
      email: account.get('email') as string,
      phone: account.get('phone') as string,
      role: account.get('role') as 'customer' | 'admin',
      authVersion: (account.get('authVersion') as number | undefined) ?? 0
    };
    return res.json({ token: createToken(user), user: safeUser(user) });
  } catch (error) {
    console.error('Customer login failed', error);
    return res.status(500).json({ error: 'Unable to sign in' });
  }
}));

router.get('/me', requireAuth, (_req, res) => {
  return res.json({ user: safeUser(res.locals.account as AuthAccount) });
});

router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const payload = profileSchema.parse(req.body);
  const account = res.locals.account as AuthAccount;

  if (process.env.NODE_ENV === 'test') {
    const stored = findUserById(account.id);
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    stored.name = payload.name;
    return res.json({ user: safeUser(stored) });
  }

  try {
    const updated = await Customer.findByIdAndUpdate(account.id, { $set: { name: payload.name } }, {
      new: true,
      runValidators: true
    }).select('customerId name email phone role');
    if (!updated) return res.status(404).json({ error: 'Account not found' });
    return res.json({
      user: safeUser({
        id: updated.id,
        customerId: updated.get('customerId') as string | undefined,
        name: updated.get('name') as string,
        email: updated.get('email') as string,
        phone: updated.get('phone') as string,
        role: updated.get('role') as 'customer' | 'admin'
      })
    });
  } catch (error) {
    console.error('Customer profile update failed', error);
    return res.status(500).json({ error: 'Unable to update the profile' });
  }
}));

router.post('/me/password', requireAuth, asyncHandler(async (req, res) => {
  const payload = passwordSchema.parse(req.body);
  const account = res.locals.account as AuthAccount;

  if (process.env.NODE_ENV === 'test') {
    const stored = findUserById(account.id);
    if (!stored || !(await bcrypt.compare(payload.currentPassword, stored.passwordHash))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    stored.passwordHash = await bcrypt.hash(payload.newPassword, 12);
    stored.authVersion = (stored.authVersion ?? 0) + 1;
    return res.status(204).end();
  }

  try {
    const stored = await Customer.findById(account.id).select('+passwordHash');
    if (!stored || !(await bcrypt.compare(payload.currentPassword, stored.get('passwordHash') as string))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    stored.set('passwordHash', await bcrypt.hash(payload.newPassword, 12));
    stored.set('authVersion', ((stored.get('authVersion') as number | undefined) ?? 0) + 1);
    await stored.save();
    return res.status(204).end();
  } catch (error) {
    console.error('Customer password update failed', error);
    return res.status(500).json({ error: 'Unable to change the password' });
  }
}));

router.get('/me/addresses', requireAuth, asyncHandler(async (_req, res) => {
  const account = res.locals.account as AuthAccount;
  if (process.env.NODE_ENV === 'test') {
    const stored = findUserById(account.id);
    return res.json({ data: stored?.addresses ?? [] });
  }
  try {
    const stored = await Customer.findById(account.id).select('addresses');
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    const addresses = stored.get('addresses') as CustomerAddressDocument[];
    return res.json({ data: addresses.map(serializeAddress) });
  } catch (error) {
    console.error('Customer address query failed', error);
    return res.status(500).json({ error: 'Unable to load saved addresses' });
  }
}));

router.post('/me/addresses', requireAuth, asyncHandler(async (req, res) => {
  const payload = addressSchema.parse(req.body);
  const account = res.locals.account as AuthAccount;
  if (process.env.NODE_ENV === 'test') {
    const stored = findUserById(account.id);
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    const addresses = stored.addresses ?? (stored.addresses = []);
    if (addresses.length >= 20) return res.status(400).json({ error: 'A maximum of 20 saved addresses is allowed' });
    const shouldBeDefault = payload.isDefault === true || addresses.length === 0;
    if (shouldBeDefault) addresses.forEach((address) => { address.isDefault = false; });
    const created = { ...payload, isDefault: shouldBeDefault, id: `addr-${account.id}-${addresses.length + 1}` };
    addresses.push(created);
    return res.status(201).json({ data: created });
  }
  try {
    const stored = await Customer.findById(account.id).select('addresses');
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    const addresses = stored.get('addresses') as CustomerAddressDocument[];
    if (addresses.length >= 20) return res.status(400).json({ error: 'A maximum of 20 saved addresses is allowed' });
    const shouldBeDefault = payload.isDefault === true || !addresses.some((address) => address.isDefault);
    const nextAddresses = addresses.map((address) => ({ ...address.toObject(), isDefault: shouldBeDefault ? false : address.isDefault }));
    nextAddresses.push({ ...payload, isDefault: shouldBeDefault });
    stored.set('addresses', nextAddresses);
    await stored.save();
    const saved = stored.get('addresses') as CustomerAddressDocument[];
    return res.status(201).json({ data: serializeAddress(saved[saved.length - 1]) });
  } catch (error) {
    console.error('Customer address creation failed', error);
    return res.status(500).json({ error: 'Unable to save the address' });
  }
}));

router.patch('/me/addresses/:addressId', requireAuth, asyncHandler(async (req, res) => {
  const payload = addressSchema.parse(req.body);
  const account = res.locals.account as AuthAccount;
  if (process.env.NODE_ENV === 'test') {
    const stored = findUserById(account.id);
    const addresses = stored?.addresses;
    const selected = addresses?.find((address) => address.id === req.params.addressId);
    if (!selected) return res.status(404).json({ error: 'Address not found' });
    const shouldBeDefault = payload.isDefault === true || selected.isDefault;
    if (shouldBeDefault) addresses?.forEach((address) => { address.isDefault = false; });
    Object.assign(selected, payload, { isDefault: shouldBeDefault });
    return res.json({ data: selected });
  }
  try {
    const stored = await Customer.findById(account.id).select('addresses');
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    const addresses = stored.get('addresses') as CustomerAddressDocument[];
    const selected = addresses.find((address) => address._id.toString() === req.params.addressId);
    if (!selected) return res.status(404).json({ error: 'Address not found' });
    const shouldBeDefault = payload.isDefault === true || selected.isDefault;
    const nextAddresses = addresses.map((address) => {
      if (address._id.toString() === req.params.addressId) {
        return { ...payload, _id: address._id, isDefault: shouldBeDefault };
      }
      return { ...address.toObject(), isDefault: shouldBeDefault ? false : address.isDefault };
    });
    stored.set('addresses', nextAddresses);
    await stored.save();
    const updated = (stored.get('addresses') as CustomerAddressDocument[]).find((address) => address._id.toString() === req.params.addressId);
    if (!updated) return res.status(404).json({ error: 'Address not found' });
    return res.json({ data: serializeAddress(updated) });
  } catch (error) {
    console.error('Customer address update failed', error);
    return res.status(500).json({ error: 'Unable to update the address' });
  }
}));

router.delete('/me/addresses/:addressId', requireAuth, asyncHandler(async (req, res) => {
  const account = res.locals.account as AuthAccount;
  if (process.env.NODE_ENV === 'test') {
    const stored = findUserById(account.id);
    if (!stored?.addresses?.some((address) => address.id === req.params.addressId)) {
      return res.status(404).json({ error: 'Address not found' });
    }
    stored.addresses = stored.addresses.filter((address) => address.id !== req.params.addressId);
    if (stored.addresses.length > 0 && !stored.addresses.some((address) => address.isDefault)) stored.addresses[0].isDefault = true;
    return res.status(204).end();
  }
  try {
    const stored = await Customer.findById(account.id).select('addresses');
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    const addresses = stored.get('addresses') as CustomerAddressDocument[];
    const remaining = addresses.filter((address) => address._id.toString() !== req.params.addressId);
    if (remaining.length === addresses.length) return res.status(404).json({ error: 'Address not found' });
    const hasDefault = remaining.some((address) => address.isDefault);
    stored.set('addresses', remaining.map((address, index) => ({
      ...address.toObject(),
      isDefault: hasDefault ? address.isDefault : index === 0
    })));
    await stored.save();
    return res.status(204).end();
  } catch (error) {
    console.error('Customer address removal failed', error);
    return res.status(500).json({ error: 'Unable to remove the address' });
  }
}));

router.get('/me/wishlist', requireAuth, asyncHandler(async (_req, res) => {
  const account = res.locals.account as AuthAccount;
  if (process.env.NODE_ENV === 'test') {
    return res.json({ data: findUserById(account.id)?.wishlist ?? [] });
  }
  try {
    const stored = await Customer.findById(account.id).select('wishlist');
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    return res.json({ data: stored.get('wishlist') ?? [] });
  } catch (error) {
    console.error('Customer wishlist query failed', error);
    return res.status(500).json({ error: 'Unable to load your wishlist' });
  }
}));

router.put('/me/wishlist', requireAuth, asyncHandler(async (req, res) => {
  const payload = wishlistSchema.parse(req.body);
  const account = res.locals.account as AuthAccount;
  const productIds = [...new Set(payload.productIds)];
  const validIds = new Set(getProducts().map((product) => product.id));
  if (productIds.some((productId) => !validIds.has(productId))) {
    return res.status(400).json({ error: 'Wishlist contains an unknown product' });
  }
  if (process.env.NODE_ENV === 'test') {
    const stored = findUserById(account.id);
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    stored.wishlist = productIds;
    return res.json({ data: stored.wishlist });
  }
  try {
    const stored = await Customer.findByIdAndUpdate(
      account.id,
      { $set: { wishlist: productIds } },
      { new: true, runValidators: true }
    ).select('wishlist');
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    return res.json({ data: stored.get('wishlist') });
  } catch (error) {
    console.error('Customer wishlist update failed', error);
    return res.status(500).json({ error: 'Unable to update your wishlist' });
  }
}));

router.post('/me/delete-request', requireAuth, asyncHandler(async (_req, res) => {
  const account = res.locals.account as AuthAccount;

  if (process.env.NODE_ENV === 'test') {
    const stored = findUserById(account.id);
    if (!stored) return res.status(404).json({ error: 'Account not found' });
    stored.deletionRequestedAt = new Date();
    return res.status(202).json({ message: 'Account deletion request received' });
  }

  try {
    const updated = await Customer.findByIdAndUpdate(account.id, {
      $set: { deletionRequestedAt: new Date() }
    }, { new: true }).select('_id');
    if (!updated) return res.status(404).json({ error: 'Account not found' });
    return res.status(202).json({ message: 'Account deletion request received' });
  } catch (error) {
    console.error('Customer deletion request failed', error);
    return res.status(500).json({ error: 'Unable to submit the account deletion request' });
  }
}));

export default router;

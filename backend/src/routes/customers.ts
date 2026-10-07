import { Router } from 'express';
import { z } from 'zod';
import { Customer } from '../models/Customer';
import { asyncHandler, AuthAccount, requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'deactivated']).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
const statusSchema = z.object({ status: z.enum(['active', 'deactivated']) });

router.use(requireAuth, requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = { role: 'customer' };
  if (query.status) filter.status = query.status;
  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) createdAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
    filter.createdAt = createdAt;
  }
  if (query.q) {
    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const search = new RegExp(escaped, 'i');
    filter.$or = [{ customerId: search }, { name: search }, { email: search }, { phone: search }];
  }

  try {
    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .select('customerId name email phone status createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      Customer.countDocuments(filter)
    ]);

    return res.json({
      data: customers.map((customer) => ({
        customerId: customer.get('customerId'),
        name: customer.get('name'),
        email: customer.get('email'),
        phone: customer.get('phone'),
        status: customer.get('status'),
        createdAt: customer.get('createdAt'),
        lastLoginAt: customer.get('lastLoginAt')
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit))
      }
    });
  } catch (error) {
    console.error('Customer list query failed', error);
    return res.status(500).json({ error: 'Unable to load customers' });
  }
}));

router.get('/:customerId', asyncHandler(async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.customerId, role: 'customer' })
      .select('customerId name email phone status isEmailVerified profileImage addresses createdAt lastLoginAt');
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    return res.json({ data: customer });
  } catch (error) {
    console.error('Customer detail query failed', error);
    return res.status(500).json({ error: 'Unable to load customer details' });
  }
}));

router.patch('/:customerId/status', asyncHandler(async (req, res) => {
  const payload = statusSchema.parse(req.body);
  const actor = res.locals.account as AuthAccount;

  try {
    const customer = await Customer.findOne({ customerId: req.params.customerId, role: 'customer' }).select('_id status');
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const currentStatus = customer.get('status') as 'active' | 'deactivated';
    if (currentStatus === payload.status) return res.json({ data: { customerId: req.params.customerId, status: currentStatus } });

    const updated = await Customer.findOneAndUpdate(
      { _id: customer.id, status: currentStatus },
      {
        $set: { status: payload.status },
        $push: {
          statusHistory: {
            actorId: actor.id,
            from: currentStatus,
            to: payload.status,
            changedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    ).select('customerId status');
    if (!updated) return res.status(409).json({ error: 'Customer status changed concurrently. Refresh and try again.' });
    return res.json({ data: { customerId: updated.get('customerId'), status: updated.get('status') } });
  } catch (error) {
    console.error('Customer status update failed', error);
    return res.status(500).json({ error: 'Unable to update customer status' });
  }
}));

export default router;

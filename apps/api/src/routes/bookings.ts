import { Hono } from 'hono';
import { db } from '../lib/db';

const bookings = new Hono();

// Get all bookings (with pagination)
bookings.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const skip = (page - 1) * limit;

  const [allBookings, total] = await Promise.all([
    db.booking.findMany({
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, address: true } },
        service: { select: { id: true, name: true, basePrice: true } }
      },
      orderBy: { scheduledAt: 'desc' }
    }),
    db.booking.count()
  ]);

  return c.json({
    data: allBookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Get booking by ID
bookings.get('/:id', async (c) => {
  const id = c.req.param('id');
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      user: true,
      property: true,
      service: true
    }
  });

  if (!booking) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  return c.json(booking);
});

// Create booking
bookings.post('/', async (c) => {
  const body = await c.req.json();

  // Validate required fields
  if (!body.userId || !body.propertyId || !body.serviceId || !body.scheduledAt) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  // Get service price
  const service = await db.service.findUnique({
    where: { id: body.serviceId }
  });

  if (!service) {
    return c.json({ error: 'Service not found' }, 404);
  }

  const booking = await db.booking.create({
    data: {
      userId: body.userId,
      propertyId: body.propertyId,
      serviceId: body.serviceId,
      scheduledAt: new Date(body.scheduledAt),
      totalPrice: body.totalPrice || service.basePrice,
      notes: body.notes,
      status: 'PENDING'
    },
    include: {
      user: true,
      property: true,
      service: true
    }
  });

  return c.json(booking, 201);
});

// Update booking status
bookings.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const booking = await db.booking.update({
    where: { id },
    data: {
      status: body.status,
      completedAt: body.status === 'COMPLETED' ? new Date() : undefined,
      notes: body.notes
    },
    include: {
      user: true,
      property: true,
      service: true
    }
  });

  return c.json(booking);
});

// Cancel booking
bookings.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const booking = await db.booking.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });

  return c.json(booking);
});

export default bookings;
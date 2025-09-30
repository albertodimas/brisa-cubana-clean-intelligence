import { Hono } from 'hono';
import { db } from '../lib/db';

const users = new Hono();

// Get all users (admin only - TODO: add auth middleware)
users.get('/', async (c) => {
  const allUsers = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
          properties: true
        }
      }
    }
  });
  return c.json(allUsers);
});

// Get user by ID
users.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await db.user.findUnique({
    where: { id },
    include: {
      properties: true,
      bookings: {
        include: {
          service: true,
          property: true
        },
        orderBy: { scheduledAt: 'desc' },
        take: 10
      }
    }
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

// Create user
users.post('/', async (c) => {
  const body = await c.req.json();

  // Check if email already exists
  const existing = await db.user.findUnique({
    where: { email: body.email }
  });

  if (existing) {
    return c.json({ error: 'Email already exists' }, 400);
  }

  const user = await db.user.create({
    data: {
      email: body.email,
      name: body.name,
      phone: body.phone,
      role: body.role || 'CLIENT'
    }
  });

  return c.json(user, 201);
});

// Update user
users.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const user = await db.user.update({
    where: { id },
    data: {
      name: body.name,
      phone: body.phone,
      role: body.role
    }
  });

  return c.json(user);
});

export default users;
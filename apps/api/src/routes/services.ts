import { Hono } from 'hono';
import { db } from '../lib/db';

const services = new Hono();

// Get all active services
services.get('/', async (c) => {
  const allServices = await db.service.findMany({
    where: { active: true },
    orderBy: { basePrice: 'asc' }
  });
  return c.json(allServices);
});

// Get service by ID
services.get('/:id', async (c) => {
  const id = c.req.param('id');
  const service = await db.service.findUnique({
    where: { id }
  });

  if (!service) {
    return c.json({ error: 'Service not found' }, 404);
  }

  return c.json(service);
});

// Create service (admin only - TODO: add auth middleware)
services.post('/', async (c) => {
  const body = await c.req.json();
  const service = await db.service.create({
    data: {
      name: body.name,
      description: body.description,
      basePrice: body.basePrice,
      duration: body.duration,
      active: body.active ?? true
    }
  });
  return c.json(service, 201);
});

// Update service (admin only - TODO: add auth middleware)
services.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const service = await db.service.update({
    where: { id },
    data: body
  });

  return c.json(service);
});

export default services;
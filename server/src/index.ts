import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

config();

const { pingDatabase } = await import('./db.js');
const { adminRoute } = await import('./routes/admin.js');
const { authRoute } = await import('./routes/auth.js');
const { bookingsRoute } = await import('./routes/bookings.js');
const { usersRoute } = await import('./routes/users.js');
const { HttpError } = await import('./validation.js');

const app = new Hono();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Idempotency-Key', 'x-idempotency-key'],
    exposeHeaders: ['X-Cache-Lookup'],
  }),
);

app.onError((error, c) => {
  if (error instanceof HttpError) {
    return c.json({ message: error.message }, error.status as any);
  }
  console.error(error);
  return c.json({ message: 'Something went wrong. Please try again.' }, 500);
});

app.get('/health', async (c) => {
  let dbStatus = 'connected';
  try {
    await pingDatabase();
  } catch {
    dbStatus = 'disconnected';
  }
  return c.json({
    status: 'online',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.route('/api/admin', adminRoute);
app.route('/api/auth', authRoute);
app.route('/api/bookings', bookingsRoute);
app.route('/api/users', usersRoute);

export { app };

const port = Number(process.env.PORT) || 8787;

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Drive Kendra mobile API listening on http://localhost:${info.port}`);
  });
}

import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

config();

const { pingDatabase } = await import('./db.js');
const { authRoute } = await import('./routes/auth.js');
const { bookingsRoute } = await import('./routes/bookings.js');
const { notificationsRoute } = await import('./routes/notifications.js');
const { reviewsRoute } = await import('./routes/reviews.js');
const { statsRoute } = await import('./routes/stats.js');
const { usersRoute } = await import('./routes/users.js');
const { HttpError } = await import('./validation.js');

const app = new Hono();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept'],
  }),
);

app.onError((error, c) => {
  if (error instanceof HttpError) {
      return c.json({ message: error.message }, error.status as 400 | 500);
  }
  console.error(error);
  return c.json({ message: 'Something went wrong. Please try again.' }, 500);
});

app.get('/health', async (c) => {
  await pingDatabase();
  return c.json({ ok: true });
});

app.route('/api/auth', authRoute);
app.route('/api/bookings', bookingsRoute);
app.route('/api/notifications', notificationsRoute);
app.route('/api/reviews', reviewsRoute);
app.route('/api/stats', statsRoute);
app.route('/api/users', usersRoute);

const port = Number(process.env.PORT) || 8787;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Drive Kendra mobile API listening on http://localhost:${info.port}`);
});

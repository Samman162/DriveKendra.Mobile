import { Hono } from 'hono';

import { withPublicClient } from '../db.js';
import { parseReview } from '../validation.js';

export const reviewsRoute = new Hono();

reviewsRoute.get('/', async (c) => {
  const result = await withPublicClient((client) =>
    client.query<{
      customer_name: string;
      rating: number;
      comment: string;
      trip_title: string | null;
      created_at: Date;
    }>(
      `SELECT customer_name, rating, comment, trip_title, created_at
       FROM cr_reviews
       WHERE is_approved = TRUE
       ORDER BY created_at DESC`,
    ),
  );

  return c.json(
    result.rows.map((row) => ({
      customer_name: row.customer_name,
      rating: Number(row.rating),
      comment: row.comment,
      trip_title: row.trip_title,
      created_at: row.created_at,
    })),
  );
});

reviewsRoute.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const review = parseReview(body);

  await withPublicClient((client) =>
    client.query(
      `INSERT INTO cr_reviews (customer_name, rating, comment, trip_title, is_approved, created_at)
       VALUES ($1, $2, $3, $4, FALSE, NOW())`,
      [review.customer_name, review.rating, review.comment, review.trip_title],
    ),
  );

  return c.json({
    message: 'Thank you! Your testimonial has been submitted for review.',
  });
});

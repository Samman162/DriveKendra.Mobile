import { Hono } from 'hono';

import { withPublicClient } from '../db.js';
import { parseReview } from '../validation.js';

export const reviewsRoute = new Hono();

reviewsRoute.get('/', async (c) => {
  const result = await withPublicClient((client) =>
    client.query<{
      review_id: number;
      user_id: number | null;
      customer_name: string;
      rating: number;
      comment: string;
      trip_title: string | null;
      created_at: Date;
    }>(
      `SELECT review_id, user_id, customer_name, rating, comment, trip_title, created_at
       FROM dka_reviews
       WHERE is_approved = TRUE
       ORDER BY created_at DESC`,
    ),
  );

  return c.json(
    result.rows.map((row) => ({
      id: row.review_id,
      user_id: row.user_id,
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
      `INSERT INTO dka_reviews (user_id, customer_name, rating, comment, trip_title, is_approved, created_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
      [review.user_id || null, review.customer_name, review.rating, review.comment, review.trip_title],
    ),
  );

  return c.json({
    message: 'Thank you! Your testimonial has been submitted for review.',
  });
});

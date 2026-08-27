import { Hono } from 'hono';

import { withPublicClient } from '../db.js';

type StatsRow = {
  fleet_count: number | string;
  completed_trips: number | string;
  cities_covered: number | string;
  review_count: number | string;
  average_rating: number | string;
};

function toStats(row: StatsRow | undefined) {
  return {
    fleet_count: Number(row?.fleet_count) || 0,
    completed_trips: Number(row?.completed_trips) || 0,
    cities_covered: Number(row?.cities_covered) || 0,
    review_count: Number(row?.review_count) || 0,
    average_rating: Number(row?.average_rating) || 0,
  };
}

export const statsRoute = new Hono();

statsRoute.get('/', async (c) => {
  const stats = await withPublicClient(async (client) => {
    try {
      const fromFunction = await client.query<StatsRow>(
        `SELECT fleet_count, completed_trips, cities_covered, review_count, average_rating
         FROM dka_get_public_stats()`,
      );
      if (fromFunction.rows[0]) {
        return toStats(fromFunction.rows[0]);
      }
    } catch {
      // Fallback if stored procedure was not applied
    }

    const fallback = await client.query<StatsRow>(`
      SELECT
        (SELECT COUNT(*) FROM dka_vehicle_types) AS fleet_count,
        (SELECT COUNT(*) FROM dka_bookings WHERE LOWER(booking_status) = 'completed') AS completed_trips,
        (SELECT COUNT(*) FROM (
          SELECT DISTINCT LOWER(TRIM(pickup_location)) AS loc FROM dka_bookings
          UNION
          SELECT DISTINCT LOWER(TRIM(dropoff_location)) FROM dka_bookings
        ) cities) AS cities_covered,
        (SELECT COUNT(*) FROM dka_reviews WHERE is_approved = TRUE) AS review_count,
        (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM dka_reviews WHERE is_approved = TRUE) AS average_rating
    `);
    return toStats(fallback.rows[0]);
  });

  return c.json(stats);
});

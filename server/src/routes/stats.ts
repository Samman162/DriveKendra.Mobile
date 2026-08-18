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
         FROM cr_get_public_stats()`,
      );
      if (fromFunction.rows[0]) {
        return toStats(fromFunction.rows[0]);
      }
    } catch {
      // Function exists only after the website RLS patch is applied.
    }

    const fallback = await client.query<StatsRow>(`
      SELECT
        (SELECT COUNT(*) FROM cr_vehicles WHERE is_active = TRUE) AS fleet_count,
        (SELECT COUNT(*) FROM cr_trip_requests WHERE LOWER(request_status) = 'completed') AS completed_trips,
        (SELECT COUNT(*) FROM (
          SELECT DISTINCT LOWER(TRIM(pickup_location)) AS loc FROM cr_trip_requests
          UNION
          SELECT DISTINCT LOWER(TRIM(dropoff_location)) FROM cr_trip_requests
        ) cities) AS cities_covered,
        (SELECT COUNT(*) FROM cr_reviews WHERE is_approved = TRUE) AS review_count,
        (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM cr_reviews WHERE is_approved = TRUE) AS average_rating
    `);
    return toStats(fallback.rows[0]);
  });

  return c.json(stats);
});

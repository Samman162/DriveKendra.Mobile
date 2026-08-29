import { NEPAL_LOCATIONS, type NepalLocationItem } from '../constants/nepalLocations';

/**
 * Calculates the great-circle distance between two points in kilometers (Haversine formula).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest known Nepal landmark from our offline curated catalog.
 */
export function findNearestNepalLandmark(
  lat: number,
  lng: number,
  maxDistanceKm = 15,
): { item: NepalLocationItem; distanceKm: number } | null {
  let closestItem: NepalLocationItem | null = null;
  let minDistance = Infinity;

  for (const item of NEPAL_LOCATIONS) {
    if (item.coordinates) {
      const dist = calculateDistanceKm(
        lat,
        lng,
        item.coordinates.latitude,
        item.coordinates.longitude,
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestItem = item;
      }
    }
  }

  if (closestItem && minDistance <= maxDistanceKm) {
    return { item: closestItem, distanceKm: minDistance };
  }

  return null;
}

/**
 * Formats a coordinate pair into a user-friendly label.
 */
export function formatCoordinateLabel(lat: number, lng: number): string {
  return `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

/**
 * Performs a free reverse geocode request using OpenStreetMap's Nominatim public API.
 * Includes timeout and graceful fallback.
 */
export async function reverseGeocodeOSM(
  lat: number,
  lng: number,
  timeoutMs = 4000,
): Promise<{ displayName: string; road?: string; suburb?: string; city?: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DriveKendraMobile/1.0 (contact@drivekendra.com)',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || !data.display_name) {
      return null;
    }

    const address = data.address || {};
    const road = address.road || address.pedestrian || address.neighbourhood || '';
    const suburb = address.suburb || address.quarter || address.village || address.town || '';
    const city = address.city || address.county || address.state || 'Nepal';

    // Construct a concise readable location name
    const parts = [road, suburb, city].filter(Boolean);
    const shortName = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');

    return {
      displayName: shortName,
      road: address.road,
      suburb: address.suburb,
      city: address.city,
    };
  } catch {
    // Network failure, timeout, or abort
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Unified place name resolver:
 * 1. Checks if within 500m of a known landmark.
 * 2. If not, attempts free OSM reverse geocoding.
 * 3. Falls back to nearest landmark (within 15km) or coordinates string.
 */
export async function resolveLocationName(
  lat: number,
  lng: number,
): Promise<{ name: string; secondaryText: string; isApproximate: boolean }> {
  // Step 1: Very close landmark match (within 600m)
  const exactLandmark = findNearestNepalLandmark(lat, lng, 0.6);
  if (exactLandmark) {
    return {
      name: exactLandmark.item.name,
      secondaryText: exactLandmark.item.secondaryText,
      isApproximate: false,
    };
  }

  // Step 2: Try online OSM Nominatim reverse geocode
  const osmResult = await reverseGeocodeOSM(lat, lng);
  if (osmResult && osmResult.displayName.trim().length > 0) {
    return {
      name: osmResult.displayName,
      secondaryText: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      isApproximate: false,
    };
  }

  // Step 3: Fallback to nearest landmark within 15km
  const nearLandmark = findNearestNepalLandmark(lat, lng, 15);
  if (nearLandmark) {
    return {
      name: `Near ${nearLandmark.item.name}`,
      secondaryText: `~${nearLandmark.distanceKm.toFixed(1)} km from ${nearLandmark.item.name}`,
      isApproximate: true,
    };
  }

  // Step 4: Final coordinate fallback
  return {
    name: formatCoordinateLabel(lat, lng),
    secondaryText: 'Nepal Region',
    isApproximate: true,
  };
}

/**
 * Performs a free live search query for actual places, streets, hotels, districts across Nepal
 * using OpenStreetMap's Nominatim public search API.
 */
export async function searchOnlineNepalLocations(
  query: string,
  timeoutMs = 4000,
): Promise<NepalLocationItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=np&limit=12&addressdetails=1&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DriveKendraMobile/1.0 (contact@drivekendra.com)',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const address = item.address || {};
      const primaryName = item.name || item.display_name.split(',')[0].trim();
      const districtOrCity = address.county || address.state_district || address.state || address.city || 'Nepal';
      const secondary = item.display_name.split(',').slice(1, 3).map((s: string) => s.trim()).join(', ') || districtOrCity;

      return {
        id: `osm_${item.place_id}`,
        name: primaryName.toLowerCase().includes('nepal') ? primaryName : `${primaryName}, Nepal`,
        secondaryText: secondary,
        category: (item.type === 'aerodrome' ? 'Airport' : (item.type === 'hotel' ? 'Hotel' : 'City')) as any,
        district: districtOrCity,
        coordinates: {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        },
      };
    });
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}


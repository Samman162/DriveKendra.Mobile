import {
  calculateDistanceKm,
  findNearestNepalLandmark,
  formatCoordinateLabel,
  resolveLocationName,
  searchOnlineNepalLocations,
} from '../src/utils/geocoding';
import { NEPAL_LOCATIONS } from '../src/constants/nepalLocations';

describe('Geocoding & Nepal Landmark Resolution Engine', () => {
  it('calculates distance between two coordinates accurately using Haversine formula', () => {
    // Kathmandu (27.7172, 85.3240) to Pokhara (28.2096, 83.9856) is ~140-150 km as the crow flies
    const dist = calculateDistanceKm(27.7172, 85.3240, 28.2096, 83.9856);
    expect(dist).toBeGreaterThan(130);
    expect(dist).toBeLessThan(160);

    // Distance to same point should be 0
    const zeroDist = calculateDistanceKm(27.7172, 85.3240, 27.7172, 85.3240);
    expect(zeroDist).toBeCloseTo(0, 4);
  });

  it('formats coordinate label properly', () => {
    const label = formatCoordinateLabel(27.71542, 85.31238);
    expect(label).toBe('Pinned Location (27.7154, 85.3124)');
  });

  it('finds nearest Nepal landmark when within threshold', () => {
    // Test point near Thamel (27.7154, 85.3123)
    const result = findNearestNepalLandmark(27.7155, 85.3124, 1.0);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.distanceKm).toBeLessThan(1.0);
      expect(result.item.name).toBeDefined();
    }
  });

  it('returns null if no landmark is within maximum radius', () => {
    // Coordinate somewhere in the middle of Pacific Ocean
    const result = findNearestNepalLandmark(0.0, 0.0, 50);
    expect(result).toBeNull();
  });

  it('resolves location name with fallback for coordinates near known landmarks', async () => {
    // Patan Durbar square coordinate
    const patan = NEPAL_LOCATIONS.find((l) => l.name.toLowerCase().includes('patan'));
    if (patan && patan.coordinates) {
      const resolved = await resolveLocationName(
        patan.coordinates.latitude,
        patan.coordinates.longitude,
      );
      expect(resolved.name).toBeDefined();
      expect(resolved.name.length).toBeGreaterThan(0);
      expect(resolved.secondaryText).toBeDefined();
    }
  });

  it('falls back gracefully to coordinate string when offline or arbitrary coordinates', async () => {
    // Remote coordinate in far western Nepal hills
    const resolved = await resolveLocationName(29.5, 81.2);
    expect(resolved.name).toBeDefined();
    expect(resolved.name.length).toBeGreaterThan(0);
  });

  it('handles online location search query safely', async () => {
    const results = await searchOnlineNepalLocations('Bhaktapur');
    expect(Array.isArray(results)).toBe(true);

    const emptyResults = await searchOnlineNepalLocations('');
    expect(emptyResults).toEqual([]);
  });
});

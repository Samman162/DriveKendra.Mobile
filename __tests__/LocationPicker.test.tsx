import {
  NEPAL_LOCATIONS,
  LOCATION_CATEGORY_TABS,
  searchNepalLocations,
} from '../src/constants/nepalLocations';

describe('Nepal Locations Catalog & Search Utilities', () => {
  it('contains comprehensive curated Nepal destinations with required properties', () => {
    expect(NEPAL_LOCATIONS.length).toBeGreaterThan(15);

    NEPAL_LOCATIONS.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.secondaryText.length).toBeGreaterThan(0);
      expect(item.category).toBeDefined();
      expect(item.district).toBeDefined();
      if (item.coordinates) {
        expect(typeof item.coordinates.latitude).toBe('number');
        expect(typeof item.coordinates.longitude).toBe('number');
      }
    });
  });

  it('filters locations by category tabs', () => {
    const airportItems = searchNepalLocations('', 'Airport');
    expect(airportItems.length).toBeGreaterThan(0);
    airportItems.forEach((item) => expect(item.category).toBe('Airport'));

    const outstationItems = searchNepalLocations('', 'Outstation');
    expect(outstationItems.length).toBeGreaterThan(0);
    outstationItems.forEach((item) => expect(item.category).toBe('Outstation'));

    const cityItems = searchNepalLocations('', 'City');
    expect(cityItems.length).toBeGreaterThan(0);
    cityItems.forEach((item) => expect(item.category).toBe('City'));
  });

  it('searches locations case-insensitively by name or district', () => {
    const tiaResults = searchNepalLocations('tia');
    expect(tiaResults.some((item) => item.name.includes('TIA'))).toBe(true);

    const pokharaResults = searchNepalLocations('Pokhara');
    expect(pokharaResults.length).toBeGreaterThan(0);
    expect(pokharaResults.some((item) => item.name.includes('Pokhara, Nepal'))).toBe(true);
    expect(pokharaResults.some((item) => item.name.includes('Pokhara International Airport'))).toBe(true);

    const kathmanduResults = searchNepalLocations('Kathmandu');
    expect(kathmanduResults.length).toBeGreaterThan(0);
    expect(kathmanduResults.some((item) => item.name.includes('Kathmandu, Nepal'))).toBe(true);
  });

  it('handles empty query by returning all items in category', () => {
    const allItems = searchNepalLocations('', 'All');
    expect(allItems.length).toBe(NEPAL_LOCATIONS.length);
  });

  it('returns empty array when query does not match any entry', () => {
    const noResults = searchNepalLocations('NonExistentPlaceXYZ123');
    expect(noResults).toEqual([]);
  });

  it('provides standard category filter tabs', () => {
    expect(LOCATION_CATEGORY_TABS.some((tab) => tab.value === 'All')).toBe(true);
    expect(LOCATION_CATEGORY_TABS.some((tab) => tab.value === 'Airport')).toBe(true);
    expect(LOCATION_CATEGORY_TABS.some((tab) => tab.value === 'Kathmandu')).toBe(true);
    expect(LOCATION_CATEGORY_TABS.some((tab) => tab.value === 'Outstation')).toBe(true);
  });
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addRecentLocation,
  clearRecentLocations,
  getRecentLocations,
  removeRecentLocation,
} from '../src/utils/recentSearchesStorage';

describe('Recent Searches Storage Engine', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts with empty recent locations array', async () => {
    const recents = await getRecentLocations();
    expect(recents).toEqual([]);
  });

  it('adds and retrieves recent locations in most-recent-first order', async () => {
    await addRecentLocation('Pokhara Lakeside', 'Kaski, Nepal');
    await addRecentLocation('TIA Airport', 'Kathmandu, Nepal');

    const recents = await getRecentLocations();
    expect(recents.length).toBe(2);
    expect(recents[0].name).toBe('TIA Airport');
    expect(recents[1].name).toBe('Pokhara Lakeside');
  });

  it('deduplicates existing locations when re-added and moves them to top', async () => {
    await addRecentLocation('Thamel', 'Kathmandu');
    await addRecentLocation('Patan Durbar', 'Lalitpur');
    await addRecentLocation('Thamel', 'Kathmandu');

    const recents = await getRecentLocations();
    expect(recents.length).toBe(2);
    expect(recents[0].name).toBe('Thamel');
    expect(recents[1].name).toBe('Patan Durbar');
  });

  it('clears all recent locations cleanly', async () => {
    await addRecentLocation('Nagarkot', 'Bhaktapur');
    await clearRecentLocations();

    const recents = await getRecentLocations();
    expect(recents).toEqual([]);
  });

  it('removes a specific location by id', async () => {
    const updated = await addRecentLocation('Bhaktapur', 'Bhaktapur, Nepal');
    const idToRemove = updated[0].id;

    const remaining = await removeRecentLocation(idToRemove);
    expect(remaining).toEqual([]);
  });
});

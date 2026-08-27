import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@drive_kendra_onboarding_completed_v1';

/**
 * Checks whether the user has already seen and completed the onboarding walkthrough.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch (error) {
    console.warn('[OnboardingStorage] Failed to read onboarding status:', error);
    return false;
  }
}

/**
 * Marks onboarding as completed in persistent storage.
 */
export async function setCompletedOnboarding(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  } catch (error) {
    console.warn('[OnboardingStorage] Failed to set onboarding completed:', error);
  }
}

/**
 * Resets onboarding status for testing or manual user replay from profile.
 */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch (error) {
    console.warn('[OnboardingStorage] Failed to reset onboarding status:', error);
  }
}

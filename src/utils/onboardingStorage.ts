import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@drive_kendra_onboarding_completed_v1';

type OnboardingListener = (completed: boolean) => void;
const listeners = new Set<OnboardingListener>();

/**
 * Subscribes a listener function to onboarding completion status changes.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeOnboarding(listener: OnboardingListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(completed: boolean) {
  listeners.forEach((listener) => {
    try {
      listener(completed);
    } catch (error) {
      console.warn('[OnboardingStorage] Listener notification failed:', error);
    }
  });
}

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
    notifyListeners(true);
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
    notifyListeners(false);
  } catch (error) {
    console.warn('[OnboardingStorage] Failed to reset onboarding status:', error);
  }
}

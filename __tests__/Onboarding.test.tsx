import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import {
  hasCompletedOnboarding,
  setCompletedOnboarding,
  resetOnboarding,
} from '../src/utils/onboardingStorage';

describe('Onboarding Storage Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to false when no status is stored', async () => {
    const isCompleted = await hasCompletedOnboarding();
    expect(isCompleted).toBe(false);
  });

  it('persists completed status correctly', async () => {
    await setCompletedOnboarding();
    const isCompleted = await hasCompletedOnboarding();
    expect(isCompleted).toBe(true);
  });

  it('resets completed status on request', async () => {
    await setCompletedOnboarding();
    expect(await hasCompletedOnboarding()).toBe(true);

    await resetOnboarding();
    expect(await hasCompletedOnboarding()).toBe(false);
  });
});

describe('OnboardingScreen Component Tests', () => {
  const mockNavigation: any = {
    navigate: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };

  const mockRoute: any = {
    key: 'onboarding-key',
    name: 'Onboarding',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders onboarding screen slides and controls', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <OnboardingScreen navigation={mockNavigation} route={mockRoute} />
        </ThemeProvider>,
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'onboarding-screen' })).toBeTruthy();
    expect(root.findByProps({ testID: 'onboarding-skip-btn' })).toBeTruthy();
    expect(root.findByProps({ testID: 'onboarding-next-btn' })).toBeTruthy();
    expect(root.findByProps({ testID: 'onboarding-dots' })).toBeTruthy();

    act(() => {
      tree?.unmount();
    });
  });

  it('skipping onboarding saves status and resets navigation to MainTabs', async () => {
    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <OnboardingScreen navigation={mockNavigation} route={mockRoute} />
        </ThemeProvider>,
      );
    });

    const root = tree!.root;
    const skipBtn = root.findByProps({ testID: 'onboarding-skip-btn' });

    await act(async () => {
      skipBtn.props.onPress();
    });

    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 1,
      routes: [
        { name: 'MainTabs' },
        { name: 'Auth', params: { initialMode: 'signin' } },
      ],
    });

    const isCompleted = await hasCompletedOnboarding();
    expect(isCompleted).toBe(true);

    act(() => {
      tree?.unmount();
    });
  });
});

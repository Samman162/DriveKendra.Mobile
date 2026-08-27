import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BrandLogo } from '../src/components/ui/BrandLogo';
import { AppSplashScreen } from '../src/components/ui/AppSplashScreen';
import { ThemeProvider } from '../src/theme/ThemeProvider';

describe('BrandLogo Component Tests', () => {
  it('renders card variant with default props', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <BrandLogo testID="test-brand-logo" />
        </ThemeProvider>,
      );
    });

    expect(tree).toBeDefined();
    const root = tree!.root;
    const logo = root.findByProps({ testID: 'test-brand-logo' });
    expect(logo).toBeTruthy();
    act(() => {
      tree?.unmount();
    });
  });

  it('renders plain and badge variants correctly', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <BrandLogo variant="plain" testID="plain-logo" />
          <BrandLogo variant="badge" size="sm" testID="badge-logo" />
        </ThemeProvider>,
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'plain-logo' })).toBeTruthy();
    expect(root.findByProps({ testID: 'badge-logo' })).toBeTruthy();
    act(() => {
      tree?.unmount();
    });
  });

  it('renders withText variant including brand text and tagline', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <BrandLogo
            variant="withText"
            showTagline
            taglineText="Travel & Tours Nepal"
            testID="with-text-logo"
          />
        </ThemeProvider>,
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'with-text-logo' })).toBeTruthy();
    act(() => {
      tree?.unmount();
    });
  });
});

describe('AppSplashScreen Component Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders starting splash screen card when not ready', () => {
    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <AppSplashScreen isReady={false} />
        </ThemeProvider>,
      );
    });

    const root = tree!.root;
    const splash = root.findByProps({ testID: 'app-splash-screen' });
    expect(splash).toBeTruthy();

    act(() => {
      tree?.unmount();
    });
  });
});

import React from 'react';
import renderer from 'react-test-renderer';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { AuthProvider } from '../src/context/AuthContext';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { ThemeModeSelector } from '../src/components/ui/ThemeModeSelector';
import { ManAvatarIllustration } from '../src/components/ui/ManAvatarIllustration';

// Mock navigation
const mockNavigation: any = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

describe('ThemeModeSelector & Theme Preferences', () => {
  it('renders Light, Dark, and System theme options', () => {
    let tree: any = null;
    renderer.act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <ThemeModeSelector />
        </ThemeProvider>,
      );
    });

    const root = tree.root;
    expect(root.findByProps({ accessibilityLabel: 'Light mode, Alpine Day' })).toBeTruthy();
    expect(root.findByProps({ accessibilityLabel: 'Dark mode, Himalayan Night' })).toBeTruthy();
    expect(root.findByProps({ accessibilityLabel: 'System mode, Device Default' })).toBeTruthy();

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('allows selecting different theme modes', () => {
    let tree: any = null;
    renderer.act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <ThemeModeSelector />
        </ThemeProvider>,
      );
    });

    const root = tree.root;
    const darkBtn = root.findByProps({ accessibilityLabel: 'Dark mode, Himalayan Night' });

    renderer.act(() => {
      darkBtn.props.onPress();
    });

    renderer.act(() => {
      tree?.unmount();
    });
  });
});

describe('ManAvatarIllustration', () => {
  it('renders correctly with default size', () => {
    let tree: any = null;
    renderer.act(() => {
      tree = renderer.create(<ManAvatarIllustration size={100} />);
    });
    expect(tree).toBeTruthy();
    renderer.act(() => {
      tree?.unmount();
    });
  });
});

describe('ProfileScreen UI', () => {
  it('renders guest screen when not authenticated', () => {
    let tree: any = null;
    renderer.act(() => {
      tree = renderer.create(
        <AuthProvider>
          <ThemeProvider>
            <ProfileScreen />
          </ThemeProvider>
        </AuthProvider>,
      );
    });

    const root = tree.root;
    expect(root.findByProps({ label: 'Sign In to Account' })).toBeTruthy();
    expect(root.findByProps({ label: 'Create New Account' })).toBeTruthy();

    renderer.act(() => {
      tree?.unmount();
    });
  });
});

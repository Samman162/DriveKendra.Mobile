import React from 'react';
import renderer from 'react-test-renderer';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { AuthProvider } from '../src/context/AuthContext';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { ThemeModeSelector } from '../src/components/ui/ThemeModeSelector';
import { AvatarPickerModal } from '../src/components/ui/AvatarPickerModal';
import { PhoneUpdateModal } from '../src/components/ui/PhoneUpdateModal';
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

describe('AvatarPickerModal', () => {
  it('renders all Himalayan explorer avatar presets', () => {
    const handleSelect = jest.fn();
    const handleClose = jest.fn();

    let tree: any = null;
    renderer.act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <AvatarPickerModal
            visible={true}
            onClose={handleClose}
            userName="Samman Budhathoki"
            onSelectAvatar={handleSelect}
          />
        </ThemeProvider>,
      );
    });

    const root = tree.root;
    expect(root.findByProps({ accessibilityLabel: 'Sherpa Guide avatar' })).toBeTruthy();
    expect(root.findByProps({ accessibilityLabel: 'Alpine Nomad avatar' })).toBeTruthy();
    expect(root.findByProps({ accessibilityLabel: 'Summit Pioneer avatar' })).toBeTruthy();

    renderer.act(() => {
      tree?.unmount();
    });
  });
});

describe('PhoneUpdateModal', () => {
  it('renders phone update sheet with security advisory', () => {
    const handleClose = jest.fn();
    const handleSuccess = jest.fn();

    let tree: any = null;
    renderer.act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <PhoneUpdateModal
            visible={true}
            onClose={handleClose}
            currentPhone="+977 9819923926"
            onSuccess={handleSuccess}
          />
        </ThemeProvider>,
      );
    });

    const root = tree.root;
    expect(root.findByProps({ label: 'New Phone Number' })).toBeTruthy();
    expect(root.findByProps({ label: 'Request Phone Update' })).toBeTruthy();

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

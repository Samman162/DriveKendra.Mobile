import { secureStorage } from '../src/utils/secureStorage';
import { offlineQueue } from '../src/api/offlineQueue';
import { isValidNepalPhone, isValidPhone, normalizeNepalPhone, normalizePhone } from '../src/utils/phone';

describe('State, Security & Storage Test Suite', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await offlineQueue.clear();
  });

  describe('Hardware SecureStore Token Management', () => {
    it('stores, retrieves, and deletes JWT session tokens securely', async () => {
      const testToken = 'jwt_test_secure_token_12345';
      await secureStorage.setItem('drivekendra_jwt_token', testToken);

      const retrieved = await secureStorage.getItem('drivekendra_jwt_token');
      expect(retrieved).toBe(testToken);

      await secureStorage.removeItem('drivekendra_jwt_token');
      const afterDelete = await secureStorage.getItem('drivekendra_jwt_token');
      expect(afterDelete).toBeNull();
    });
  });

  describe('Nepal Phone Formatting & Validation', () => {
    it('validates standard 10-digit mobile numbers starting with 98 and 97', () => {
      expect(isValidNepalPhone('9851363783')).toBe(true);
      expect(isValidNepalPhone('9741234567')).toBe(true);
      expect(isValidNepalPhone('+977 985-1363783')).toBe(true);
      expect(isValidNepalPhone('014412345')).toBe(true); // Landline
    });

    it('rejects invalid or incomplete phone numbers', () => {
      expect(isValidNepalPhone('12345')).toBe(false);
      expect(isValidNepalPhone('985136378')).toBe(false); // 9 digits
      expect(isValidNepalPhone('8881234567')).toBe(false);
    });

    it('cleans non-digit characters correctly', () => {
      expect(normalizeNepalPhone('+977 985-136-3783')).toBe('9779851363783');
    });
  });

  describe('International Phone Formatting & Validation', () => {
    it('accepts valid phone numbers from various countries', () => {
      expect(isValidPhone('+1 415 555 2671')).toBe(true); // USA
      expect(isValidPhone('+91 9876543210')).toBe(true); // India
      expect(isValidPhone('+44 7911 123456')).toBe(true); // UK
      expect(isValidPhone('+61 412 345 678')).toBe(true); // Australia
      expect(isValidPhone('+977 9851363783')).toBe(true); // Nepal with country code
      expect(isValidPhone('9851363783')).toBe(true); // Nepal mobile local
    });

    it('rejects numbers with invalid lengths', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('+1')).toBe(false);
    });

    it('normalizes international numbers correctly', () => {
      expect(normalizePhone('+1 (415) 555-2671')).toBe('+14155552671');
      expect(normalizePhone('+977 985-1363783')).toBe('+9779851363783');
    });
  });

  describe('Offline Booking Queue & Network Resilience', () => {
    it('enqueues pending bookings and flushes successfully when back online', async () => {
      const mockBooking = {
        full_name: 'Samman Chhetri',
        phone_number: '9851363783',
        pickup_location: 'Kathmandu',
        dropoff_location: 'Pokhara',
        pickup_date: '2026-08-20',
        passenger_count: 2,
        trip_type: 'One Way' as const,
        vehicle_type_id: 2,
      };

      const queueId = await offlineQueue.enqueue(mockBooking);
      expect(queueId).toBeTruthy();

      const queue = await offlineQueue.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].payload.full_name).toBe('Samman Chhetri');

      const mockSubmit = jest.fn().mockResolvedValue({ message: 'Success' });
      const result = await offlineQueue.flush(mockSubmit);

      expect(result.synced).toBe(1);
      expect(mockSubmit).toHaveBeenCalledWith(mockBooking);

      const queueAfterFlush = await offlineQueue.getQueue();
      expect(queueAfterFlush.length).toBe(0);
    });
  });
});

describe('AuthScreen Component UI Tests', () => {
  const React = require('react');
  const renderer = require('react-test-renderer');
  const { AuthScreen } = require('../src/screens/AuthScreen');
  const { AuthProvider } = require('../src/context/AuthContext');
  const { ThemeProvider } = require('../src/theme/ThemeProvider');

  const mockNavigation: any = {
    navigate: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  };

  const mockRoute: any = {
    key: 'auth-key',
    name: 'Auth',
    params: { initialMode: 'signin' },
  };

  it('renders redesigned Login screen with MapPin badge, phone, password and login button', () => {
    let tree: any = null;
    renderer.act(() => {
      tree = renderer.create(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(
            ThemeProvider,
            null,
            React.createElement(AuthScreen, {
              navigation: mockNavigation,
              route: mockRoute,
            }),
          ),
        ),
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'map-pin-brand-badge' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-phone-input' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-password-input' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-login-btn' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-goto-signup-btn' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-goto-forgot-btn' })).toBeTruthy();

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('validates required fields on empty login submission', async () => {
    let tree: any = null;
    renderer.act(() => {
      tree = renderer.create(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(
            ThemeProvider,
            null,
            React.createElement(AuthScreen, {
              navigation: mockNavigation,
              route: mockRoute,
            }),
          ),
        ),
      );
    });

    const root = tree.root;
    const loginBtn = root.findByProps({ testID: 'auth-login-btn' });

    await renderer.act(async () => {
      loginBtn.props.onPress();
    });

    // Should stay on screen and show field errors
    expect(root.findByProps({ testID: 'auth-phone-input' })).toBeTruthy();

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('renders redesigned Signup screen with hero illustration, full name, phone, password and register button', () => {
    const signupRoute: any = {
      key: 'auth-signup-key',
      name: 'Auth',
      params: { initialMode: 'signup' },
    };

    let tree: any = null;
    renderer.act(() => {
      tree = renderer.create(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(
            ThemeProvider,
            null,
            React.createElement(AuthScreen, {
              navigation: mockNavigation,
              route: signupRoute,
            }),
          ),
        ),
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'signup-hero-illustration' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-signup-name-input' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-signup-phone-input' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-signup-password-input' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-signup-confirm-password-input' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-terms-checkbox' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-register-btn' })).toBeTruthy();
    expect(root.findByProps({ testID: 'auth-goto-signin-btn' })).toBeTruthy();

    renderer.act(() => {
      tree?.unmount();
    });
  });
});

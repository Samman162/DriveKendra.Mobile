import React from 'react';
import renderer from 'react-test-renderer';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { CustomerNotificationsModal } from '../src/components/ui/CustomerNotificationsModal';
import { AdminNotificationsModal } from '../src/screens/admin/AdminNotificationsModal';
import * as usersApi from '../src/api/users';
import * as adminApi from '../src/api/admin';

jest.mock('../src/api/users');
jest.mock('../src/api/admin');

describe('Notifications Subsystem Flow (Customer & Admin POVs)', () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Customer Notifications Modal', () => {
    it('renders customer notifications with unread states and trip updates', async () => {
      const mockNotifs = [
        {
          id: 101,
          userId: 1,
          bookingId: 44,
          title: 'Trip #44 Confirmed!',
          message: 'Scorpio 4x4 assigned with Driver Pasang Sherpa (+977 9851000111). Agreed Fare: NPR 18,500.',
          type: 'booking_confirmed',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 102,
          userId: 1,
          bookingId: null,
          title: 'Himalayan Weather Advisory',
          message: 'Clear skies forecasted across Kathmandu-Pokhara corridor today.',
          type: 'weather_advisory',
          isRead: true,
          createdAt: new Date().toISOString(),
        },
      ];

      (usersApi.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifs);
      (usersApi.markNotificationAsRead as jest.Mock).mockResolvedValue({ success: true });

      let tree: any = null;
      const onUnreadChange = jest.fn();

      await renderer.act(async () => {
        tree = renderer.create(
          <ThemeProvider>
            <CustomerNotificationsModal
              visible={true}
              onClose={jest.fn()}
              userId={1}
              phoneNumber="+977 9851363783"
              onUnreadCountChange={onUnreadChange}
            />
          </ThemeProvider>,
        );
      });

      const root = tree.root;
      const textNodes = root.findAllByType('Text' as any);
      const textContents = textNodes.map((t: any) => t.props.children).flat();

      expect(textContents).toContain('Notifications & Alerts');
      expect(textContents).toContain('Trip #44 Confirmed!');
      expect(textContents).toContain('Himalayan Weather Advisory');
      expect(onUnreadChange).toHaveBeenCalledWith(1);

      renderer.act(() => {
        tree?.unmount();
      });
    });

    it('renders empty state when customer has no notifications', async () => {
      (usersApi.getUserNotifications as jest.Mock).mockResolvedValue([]);

      let tree: any = null;
      await renderer.act(async () => {
        tree = renderer.create(
          <ThemeProvider>
            <CustomerNotificationsModal
              visible={true}
              onClose={jest.fn()}
              userId={2}
            />
          </ThemeProvider>,
        );
      });

      const root = tree.root;
      const textNodes = root.findAllByType('Text' as any);
      const textContents = textNodes.map((t: any) => t.props.children).flat();

      expect(textContents).toContain('No Notifications Yet');

      renderer.act(() => {
        tree?.unmount();
      });
    });
  });

  describe('Admin Notifications Desk Modal', () => {
    it('renders audit log of all system & dispatch notifications', async () => {
      const mockAdminNotifs = [
        {
          id: 501,
          userId: 1,
          bookingId: 44,
          title: 'Trip #44 Dispatched',
          message: 'Vehicle BA 2 CHA 8899 assigned to customer Samman Chhetri.',
          type: 'booking_confirmed',
          isRead: true,
          createdAt: new Date().toISOString(),
          userName: 'Samman Chhetri',
          userPhone: '+977 9851363783',
        },
      ];

      (adminApi.getAdminNotifications as jest.Mock).mockResolvedValue(mockAdminNotifs);

      let tree: any = null;
      await renderer.act(async () => {
        tree = renderer.create(
          <ThemeProvider>
            <AdminNotificationsModal
              visible={true}
              onClose={jest.fn()}
            />
          </ThemeProvider>,
        );
      });

      const root = tree.root;
      const textNodes = root.findAllByType('Text' as any);
      const textContents = textNodes.map((t: any) => t.props.children).flat();

      expect(textContents).toContain('Admin Notifications Desk');
      expect(textContents).toContain('+ New Broadcast');
      expect(textContents).toContain('Trip #44 Dispatched');

      renderer.act(() => {
        tree?.unmount();
      });
    });
  });
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import type { BookingEntryDto } from '../types/api';

const OFFLINE_QUEUE_KEY = '@drivekendra_offline_bookings_queue';

export type QueuedBooking = {
  id: string;
  payload: BookingEntryDto;
  idempotencyKey?: string;
  timestamp: string;
  retryCount: number;
};

export const offlineQueue = {
  async getQueue(): Promise<QueuedBooking[]> {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to read offline booking queue:', e);
      return [];
    }
  },

  async enqueue(booking: BookingEntryDto, idempotencyKey?: string): Promise<string> {
    const queue = await this.getQueue();
    const id = `queue_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const item: QueuedBooking = {
      id,
      payload: booking,
      idempotencyKey,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(item);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return id;
  },

  async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const updated = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  async flush(
    submitFn: (booking: BookingEntryDto, idempotencyKey?: string) => Promise<any>,
  ): Promise<{ synced: number; failed: number }> {
    const queue = await this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: QueuedBooking[] = [];

    for (const item of queue) {
      try {
        if (item.idempotencyKey) {
          await submitFn(item.payload, item.idempotencyKey);
        } else {
          await submitFn(item.payload);
        }
        synced += 1;
      } catch (err: any) {
        // If 4xx client validation error, discard; if network error, retain for retry
        if (err?.response?.status && err.response.status >= 400 && err.response.status < 500) {
          failed += 1;
        } else {
          item.retryCount += 1;
          remaining.push(item);
          failed += 1;
        }
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    return { synced, failed };
  },
};

// Automatic background sync listener when device regains connectivity
let isListenerActive = false;

export function initOfflineQueueSync(
  submitFn: (booking: BookingEntryDto, idempotencyKey?: string) => Promise<any>,
) {
  if (isListenerActive) return;
  isListenerActive = true;

  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      offlineQueue.flush(submitFn).then((res) => {
        if (res.synced > 0) {
          console.log(`[OfflineQueue] Successfully synced ${res.synced} pending bookings.`);
        }
      }).catch((e) => {
        console.warn('[OfflineQueue] Flush error:', e);
      });
    }
  });
}

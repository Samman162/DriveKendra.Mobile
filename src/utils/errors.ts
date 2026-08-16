import axios from 'axios';

function firstModelStateMessage(data: Record<string, unknown>): string | null {
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
      return value[0];
    }
    if (typeof value === 'string' && value) {
      return value;
    }
    if (value && typeof value === 'object') {
      const nested = firstModelStateMessage(value as Record<string, unknown>);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) {
      return data;
    }
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (typeof record.message === 'string' && record.message.trim()) {
        return record.message;
      }
      if (typeof record.title === 'string' && record.title.trim()) {
        return record.title;
      }
      if (record.errors && typeof record.errors === 'object') {
        const fromErrors = firstModelStateMessage(record.errors as Record<string, unknown>);
        if (fromErrors) {
          return fromErrors;
        }
      }
      const fromState = firstModelStateMessage(record);
      if (fromState) {
        return fromState;
      }
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function emptyToNull(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
}

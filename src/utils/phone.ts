import { NEPAL_PHONE_DIGITS, INTERNATIONAL_PHONE_REGEX } from '../constants/validation';

export function normalizeNepalPhone(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function isValidNepalPhone(value: string): boolean {
  const digits = normalizeNepalPhone(value);
  return NEPAL_PHONE_DIGITS.test(digits);
}

export function normalizePhone(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export function isValidPhone(value: string): boolean {
  if (!value) return false;
  const normalized = normalizePhone(value);
  const rawDigits = normalized.replace(/\D/g, '');
  if (rawDigits.length < 7 || rawDigits.length > 15) {
    return false;
  }
  return INTERNATIONAL_PHONE_REGEX.test(normalized) || NEPAL_PHONE_DIGITS.test(rawDigits);
}

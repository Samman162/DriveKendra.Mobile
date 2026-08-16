import { NEPAL_PHONE_DIGITS } from '../constants/validation';

export function normalizeNepalPhone(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function isValidNepalPhone(value: string): boolean {
  const digits = normalizeNepalPhone(value);
  return NEPAL_PHONE_DIGITS.test(digits);
}

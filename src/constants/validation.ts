export const NEPAL_PHONE_ERROR =
  'Enter a valid Nepal mobile (97/98) or landline number.';

export const NEPAL_PHONE_DIGITS = /^(?:977)?(9[78]\d{8}|0[1-9]\d{7})$/;

export const PHONE_ERROR =
  'Please enter a valid phone number (e.g. +977 9851363783, +1 415 555 2671).';

export const INTERNATIONAL_PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export const LIMITS = {
  bookingName: 100,
  phone: 20,
  bookingEmail: 100,
  location: 255,
  additionalDetails: 2000,
  passengersMin: 1,
  passengersMax: 50,
  reviewName: 100,
  reviewTrip: 150,
  reviewComment: 2000,
} as const;

// src/utils/customerNumber.ts
//
// Customer number captured in the Task Closure signature & rating sheet.
// Port of the Java rules in:
//   - Util/CommonFunction.isValidPhone_10To12Digit() : India (CountryDetailsId 1), digits only, 10-12 long
//   - Util/CommonFunction.isValidPhoneNRI()          : everyone else, must be longer than 6 characters
//   - res/layout/signature_rate.xml                  : android:digits="0123456789", android:maxLength="12"
// The field is optional in Java: nothing is checked until something is typed.

import { isIndiaCountryDetailsId } from '../state/session';

export const CUSTOMER_NUMBER_MAX_LENGTH = 12;
export const CUSTOMER_NUMBER_MIN_LENGTH_INDIA = 10;
export const CUSTOMER_NUMBER_MIN_LENGTH_NRI = 7;

/** Keeps digits only and caps the length, the same as the Android input filter. */
export const sanitizeCustomerNumber = (raw: string): string =>
  raw.replace(/\D/g, '').slice(0, CUSTOMER_NUMBER_MAX_LENGTH);

/**
 * Returns the message to show, or null when the value is acceptable.
 * Empty is always acceptable (optional field).
 */
export function validateCustomerNumber(value: string, isIndia: boolean = isIndiaCountryDetailsId()): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  if (!/^\d+$/.test(trimmed)) {
    return 'Customer number can only contain digits.';
  }
  if (trimmed.length > CUSTOMER_NUMBER_MAX_LENGTH) {
    return `Customer number can be at most ${CUSTOMER_NUMBER_MAX_LENGTH} digits.`;
  }
  if (isIndia) {
    if (trimmed.length < CUSTOMER_NUMBER_MIN_LENGTH_INDIA) {
      return `Please enter a valid customer number (${CUSTOMER_NUMBER_MIN_LENGTH_INDIA} to ${CUSTOMER_NUMBER_MAX_LENGTH} digits).`;
    }
  } else if (trimmed.length < CUSTOMER_NUMBER_MIN_LENGTH_NRI) {
    return `Please enter a valid customer number (at least ${CUSTOMER_NUMBER_MIN_LENGTH_NRI} digits).`;
  }
  return null;
}
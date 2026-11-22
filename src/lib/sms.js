/**
 * AUlaf Indian (+91) Mobile Phone Number Normalization Utility.
 * Normalizes input phone numbers to clean 10-digit Indian mobile formats.
 */

export function normalizeIndianTenDigits(phoneNumber) {
  if (!phoneNumber) return '';
  const digits = phoneNumber.toString().replace(/\D/g, '');
  if (digits.length < 10) return '';
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 10) return digits;
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(2, 12);
  return digits.slice(-10);
}


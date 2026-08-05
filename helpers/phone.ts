const SK_PHONE_REGEX = /^(\+421|0)?9\d{8}$/;

export function normalizePhone(value: string) {
  return value.trim().replace(/[\s()-]/g, "");
}

export function isValidSlovakPhone(value: string) {
  return SK_PHONE_REGEX.test(normalizePhone(value));
}

export function normalizeSlovakPhoneOrNull(value: string | undefined | null) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = normalizePhone(value);

  if (!normalized) {
    return null;
  }

  if (!SK_PHONE_REGEX.test(normalized)) {
    return null;
  }

  return normalized;
}

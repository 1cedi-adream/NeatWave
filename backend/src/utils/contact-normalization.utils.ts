export function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^+\d]/g, "");
}

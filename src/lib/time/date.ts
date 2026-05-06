export function dateKeyForOffset(dayOffset = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

export function dateKey() {
  return dateKeyForOffset(0);
}

export function getNextResetText(now = new Date()) {
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0);
  const total = Math.max(0, reset.getTime() - now.getTime());
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

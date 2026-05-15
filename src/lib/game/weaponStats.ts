export type WeaponStatValue = string | number | null | undefined;

export function formatWeaponStat(value: WeaponStatValue) {
  if (value === Number.POSITIVE_INFINITY) return "\u221e";
  return value || "N / A";
}

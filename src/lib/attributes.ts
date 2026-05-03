import type { WeaponAttribute } from "../types";

export function formatWeaponAttribute(attribute: WeaponAttribute) {
  return `${attribute.label}: ${attribute.text}`;
}

export function weaponAttributesText(attributes: WeaponAttribute[]) {
  return attributes.map(formatWeaponAttribute).join(" ");
}

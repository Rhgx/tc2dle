export function inferType(name: string, slot: string, notes: string) {
  const text = `${name} ${slot} ${notes}`.toLowerCase();
  if (/pda|watch|cloak|disguise|sapper|building/.test(text)) return "PDA";
  if (/melee|bat|pan|fists|sword|knife|wrench|saw|axe|shovel|bottle|club|blade|machete|sign|racket|cane/.test(text)) return "Melee";
  if (/lunchbox|cola|milk|drink|consume|sandvich|burger|banana|sneakers|boots|wearer/.test(text)) return "Utility";
  if (/rocket|grenade|sticky|flare|syringe|arrow|projectile|launcher|cannon|throw|ball/.test(text)) return "Projectile";
  if (/flame|fire|burn|ignite|afterburn/.test(text)) return "Flame";
  if (/medigun|heal|overheal|supercharge/.test(text)) return "Healing";
  return "Hitscan";
}

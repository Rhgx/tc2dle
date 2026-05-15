export function inferType(name: string, slot: string, attributes: string) {
  const text = `${name} ${slot} ${attributes}`.toLowerCase();
  if (/pda|watch|cloak|disguise|sapper|building/.test(text)) return ["PDA"];
  if (hasMeleeSignal(text)) return hasMeleeProjectileSignal(text) ? ["Melee", "Projectile"] : ["Melee"];
  if (/lunchbox|cola|milk|drink|consume|sandvich|burger|banana|sneakers|boots|wearer/.test(text)) return ["Utility"];

  const types = [];
  if (hasHitscanSignal(text)) types.push("Hitscan");
  if (hasProjectileSignal(text)) types.push("Projectile");
  if (!types.length && /medigun|heal|overheal|supercharge/.test(text)) return ["Healing"];
  return types.length ? types : ["Hitscan"];
}

function hasMeleeSignal(text: string) {
  return /melee|bat|pan|fists|sword|knife|wrench|saw|axe|shovel|bottle|club|blade|machete|sign|racket|cane/.test(text);
}

function hasHitscanSignal(text: string) {
  return /shoots? bullets?|fires? (?:a |one |[0-9]+ )?bullets?|weapon fires a single bullet|loads bullets/.test(text);
}

function hasProjectileSignal(text: string) {
  return /rocket|grenade|sticky|flare|syringe|arrow|projectile|launcher|cannon|cleaver|batarang|shoots? (?:lasers?|projectiles?|arrows?|syringes?)|fires? (?:a |an |special |charged |single |one )?(?:dart|bolt|projectile|rocket|grenade|arrow|syringe|pipe|cannon)|throws? (?:cards?|cleavers?)|launches? (?:a |an )?(?:ball|snowball|ornament|rocket|grenade|projectile)|projectile (?:cannot|deals|penetrates|speed|deviates)|flames?|flamethrower|burns?|burning|burned|ignite|afterburn|fire damage|sets? .* on fire/.test(text);
}

function hasMeleeProjectileSignal(text: string) {
  return /(?:'alt-fire':\s*)?launches? (?:a |an )?(?:ball|snowball|festive ornament|ornament)|cannot be picked up after being thrown|throws? (?:a |an )?(?:cleaver|card|batarang)/.test(text);
}

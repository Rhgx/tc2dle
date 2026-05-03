export const CLASSES = [
  "Flanker",
  "Trooper",
  "Arsonist",
  "Annihilator",
  "Brute",
  "Mechanic",
  "Doctor",
  "Marksman",
  "Agent",
  "All Classes",
] as const;

export const CLASS_ROLES: Record<string, string> = {
  Flanker: "Pick",
  Marksman: "Pick",
  Annihilator: "Pick",
  Trooper: "Power",
  Brute: "Power",
  Arsonist: "Power",
  Mechanic: "Support",
  Doctor: "Support",
  Agent: "Support",
  "All Classes": "Universal",
  "Community Only": "Special",
};

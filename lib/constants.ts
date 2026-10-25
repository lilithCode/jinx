// Shared between client and server. No secrets here.

export const AVATARS = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
  "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤",
  "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🦋",
  "🐌", "🐞", "🐜", "🪲", "🕷️", "🦂", "🐢", "🐍", "🦎", "🦖",
  "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬",
  "🐳", "🐋", "🦈", "🦭", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧",
  "🦣", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🦬", "🐃",
  "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐈‍⬛",
  "🐓", "🦃", "🦤", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝",
  "🦨", "🦡", "🦫", "🦦", "🦥", "🐁", "🐀", "🐿️", "🦔", "🐉",
] as const;

export const JAR_EMOJIS = [
  "🫙", "🎉", "🌙", "🍓", "🎮", "🍕", "🌈", "👻", "🍿", "🌸",
  "💀", "🦇", "🕷️", "🕸️", "🔮", "🧪", "⚗️", "🗝️", "🕯️", "⚰️",
  "🪦", "🖤", "💜", "🩷", "💣", "🧨", "🔥", "⚡", "🎲", "🃏",
  "🎭", "🎪", "🎸", "🎧", "🎤", "🍭", "🧁", "🍉", "🧋", "🌹",
  "🥀", "🌚", "✨", "💎", "👑", "🎀", "🧸", "🐾", "🍀", "🚀",
] as const;

export const LIMITS = {
  codeLength: 6,
  nameMax: 20,
  jarNameMax: 32,
  dareMin: 3,
  dareMax: 200,
  slipsPerPlayer: 30,
  slipsPerJar: 500,
  minPlayers: 2,
  maxPlayers: 30,
  passwordMax: 64,
} as const;

// One colour per seat (golden-angle hues so neighbours look different); also tints that player's slips.
export const PLAYER_COLORS = Array.from(
  { length: LIMITS.maxPlayers },
  (_, i) => `hsl(${Math.round((i * 137.508) % 360)} 78% 70%)`,
);

// No 0/O, 1/I/L: codes are read aloud and typed on phones.
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const normalizeCode = (raw: string) =>
  raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, LIMITS.codeLength);

export const REACTIONS = ["😂", "🔥", "😱", "👏", "💀", "🫶"] as const;

export const POINTS = { done: 2, chicken: -1 } as const;

export type Outcome = "done" | "chicken" | "veto";

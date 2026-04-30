const bannedNicknameWords = [
  "admin",
  "administrator",
  "moderator",
  "support",
  "supabase",
  "vercel",
  "pine support",
  "pine admin",
  "pine moderator",
  "ебан",
  "ебл",
  "хуй",
  "пизд",
  "бляд",
  "шлюх",
  "гандон",
  "пидор",
  "нигер",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "whore",
  "slut",
  "bitch",
  "cunt",
  "motherfucker",
  "fuck",
  "shit",
  "suicide",
  "kill yourself",
  "terror",
  "isis",
  "hitler",
  "nazi"
] as const;

function normalizeDisplayName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateDisplayName(value: string) {
  const trimmed = value.trim();

  if (trimmed.length < 2) {
    return "Имя должно быть не короче 2 символов.";
  }

  if (trimmed.length > 40) {
    return "Имя должно быть не длиннее 40 символов.";
  }

  const normalized = normalizeDisplayName(trimmed);
  const matched = bannedNicknameWords.find((item) => normalized.includes(item));

  if (matched) {
    return "Такое имя нельзя использовать на площадке.";
  }

  return null;
}

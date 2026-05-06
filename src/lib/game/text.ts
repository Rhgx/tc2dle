export function cleanText(value: unknown) {
  return String(value || "")
    .replace(/\[[^\]]*edit[^\]]*\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

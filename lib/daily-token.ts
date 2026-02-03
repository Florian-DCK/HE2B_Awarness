const BRUSSELS_TZ = "Europe/Brussels";
const TOKEN_LENGTH = 8;

const brusselsDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BRUSSELS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const getBrusselsDateString = (date = new Date()) => {
  return brusselsDateFormatter.format(date);
};

const bytesToBase36 = (bytes: Uint8Array, length = TOKEN_LENGTH) => {
  let value = 0n;
  const limit = Math.min(bytes.length, 8);
  for (let i = 0; i < limit; i += 1) {
    value = (value << 8n) + BigInt(bytes[i]);
  }
  const raw = value.toString(36);
  return raw.padStart(length, "0").slice(0, length);
};

export const getDailyToken = async (date = new Date()) => {
  const secret = process.env.DAILY_TOKEN_SECRET ?? "dev-secret";
  const dateString = getBrusselsDateString(date);
  const input = `${dateString}|${secret}`;
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToBase36(new Uint8Array(digest));
};


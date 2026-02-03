const BRUSSELS_TZ = "Europe/Brussels";
const TOKEN_LENGTH = 8;
const TOKEN_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

const brusselsDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BRUSSELS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const getBrusselsDateString = (date = new Date()) => {
  return brusselsDateFormatter.format(date);
};

const bytesToToken = (bytes: Uint8Array, length = TOKEN_LENGTH) => {
  let output = "";
  for (let i = 0; output.length < length; i += 1) {
    const index = bytes[i % bytes.length] % TOKEN_ALPHABET.length;
    output += TOKEN_ALPHABET[index];
  }
  return output;
};

export const getDailyToken = async (date = new Date()) => {
  const secret = process.env.DAILY_TOKEN_SECRET ?? "dev-secret";
  const dateString = getBrusselsDateString(date);
  const input = `${dateString}|${secret}`;
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToToken(new Uint8Array(digest));
};

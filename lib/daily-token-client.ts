const DAILY_TOKEN_REGEX = /^[0-9a-z]{8}$/;

export const getDailyTokenFromPathname = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  const [first] = segments;
  return DAILY_TOKEN_REGEX.test(first) ? first : "";
};

export const getDailyPrefixFromPathname = (pathname: string) => {
  const token = getDailyTokenFromPathname(pathname);
  return token ? `/${token}` : "";
};


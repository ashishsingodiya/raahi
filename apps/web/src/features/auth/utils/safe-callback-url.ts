/**
 * Only allow same-site relative paths, to prevent open redirects
 * like /login?callbackUrl=https://evil.com
 */
export function safeCallbackUrl(value: string | string[] | undefined) {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

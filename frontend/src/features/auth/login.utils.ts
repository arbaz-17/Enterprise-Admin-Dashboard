export function getRedirectPath(from: unknown) {
  if (
    typeof from !== "string" ||
    !from.startsWith("/") ||
    from.startsWith("//") ||
    from.includes("\\") ||
    /^\/login(?:\/|[?#]|$)/i.test(from)
  ) {
    return "/";
  }

  return from;
}

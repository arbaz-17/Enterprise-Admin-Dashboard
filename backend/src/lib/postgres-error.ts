
export function getPostgresErrorCode(error: unknown): string | null {
  let current: unknown = error;

  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== "object") {
      return null;
    }

    if ("code" in current && typeof current.code === "string") {
      return current.code;
    }

    current = "cause" in current ? current.cause : null;
  }

  return null;
}

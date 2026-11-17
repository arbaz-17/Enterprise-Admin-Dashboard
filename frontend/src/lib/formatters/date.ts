
const localDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const utcDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const localDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatValidDate(
  value: string | null | undefined,
  formatter: Intl.DateTimeFormat,
): string {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : formatter.format(date);
}

/** Full timestamp, displayed as a local date. */
export function formatLocalDate(
  value: string | null | undefined,
): string {
  return formatValidDate(value, localDateFormatter);
}

/** Full timestamp, with its date displayed in UTC. */
export function formatUtcDate(
  value: string | null | undefined,
): string {
  return formatValidDate(value, utcDateFormatter);
}

/** Date-only value such as "2026-11-17". */
export function formatDateOnly(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  return formatValidDate(
    `${value}T00:00:00Z`,
    utcDateFormatter,
  );
}

/** Full timestamp, displayed with local date and time. */
export function formatLocalDateTime(
  value: string | null | undefined,
): string {
  return formatValidDate(value, localDateTimeFormatter);
}

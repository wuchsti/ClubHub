/** Parses a German-style decimal-comma euro input ("2,50") into integer cents. Returns null for anything non-positive or unparseable. */
export function euroToCents(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  const euros = Number.parseFloat(normalized);
  if (!Number.isFinite(euros) || euros <= 0) {
    return null;
  }
  return Math.round(euros * 100);
}

/** Formats integer cents as a German-locale euro string, e.g. 250 -> "2,50 €". */
export function formatEuro(cents: number): string {
  return (
    (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
  );
}

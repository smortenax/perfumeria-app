/**
 * Where a key moves the selection in a tablist, as ARIA's tabs pattern asks (vault pass 2026-10-24,
 * F-09): the arrows step and wrap, Home and End jump to the ends, and any other key moves nothing
 * (null). `at` is the selected tab's index; one not in the list counts as the first.
 */
export function tabAfterKey(key: string, at: number, count: number): number | null {
  if (count === 0) return null;
  const from = at < 0 ? 0 : at;
  switch (key) {
    case "ArrowRight":
      return (from + 1) % count;
    case "ArrowLeft":
      return (from + count - 1) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

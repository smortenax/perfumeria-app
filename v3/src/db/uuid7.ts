/**
 * A UUID v7 (RFC 9562), made on the device: 48 bits of Unix time in milliseconds, then a 12-bit
 * counter and 62 random bits. Sorted as text, they follow the time they were made, so a formula's
 * history is ordered by its events' ids, and two devices without network never clash, as a
 * consecutive `seq` would (plan v3, step 7.2). Within one millisecond the counter keeps the order.
 */
let lastMs = -1;
let counter = 0;

export function uuidv7(now: number = Date.now()): string {
  let ms = Math.max(now, lastMs);
  if (ms === lastMs) {
    counter++;
    if (counter > 0xfff) {
      // More than 4096 in one millisecond: borrow the next one, still in order.
      ms++;
      counter = 0;
    }
  } else {
    counter = 0;
  }
  lastMs = ms;
  const random = crypto.getRandomValues(new Uint8Array(8));
  const hex = (n: number, width: number) => n.toString(16).padStart(width, "0");
  const time = hex(ms, 12);
  const versionAndCounter = hex(0x7000 | counter, 4);
  const variant = hex(0x80 | (random[0] & 0x3f), 2) + hex(random[1], 2);
  const rest = [...random.slice(2)].map((b) => hex(b, 2)).join("");
  return `${time.slice(0, 8)}-${time.slice(8)}-${versionAndCounter}-${variant}-${rest}`;
}

/** The time a UUID v7 was made, in milliseconds. */
export const timeOf = (id: string): number => parseInt(id.replace(/-/g, "").slice(0, 12), 16);

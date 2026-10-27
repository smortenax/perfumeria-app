/** The letters of a material without an abbreviation: its initials, shown as such (in italics). */
export const initials = (name: string) =>
  name
    .split(/[\s,()-]+/)
    .filter((w) => /\p{L}|\d/u.test(w))
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");

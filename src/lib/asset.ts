/** Public-file URL that respects Vite `base` (GitHub Pages lives under /skyknight-raven/). */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const trimmed = path.replace(/^\//, "");
  return `${base}${trimmed}`;
}

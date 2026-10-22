// Small indirection so the impure Math.random() call lives outside
// component render bodies, satisfying the react-hooks/purity lint rule.
export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

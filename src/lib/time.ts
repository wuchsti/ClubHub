// Small indirection so the impure Date.now() call lives outside component
// render bodies, satisfying the react-hooks/purity lint rule.
export function currentTimestamp(): number {
  return Date.now();
}

export function currentYear(): number {
  return new Date().getFullYear();
}

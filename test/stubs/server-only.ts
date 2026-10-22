// Next.js resolves the real "server-only" import guard itself at build
// time; it isn't an installed package, so Vitest (plain Vite resolution)
// needs this no-op stub aliased in vitest.config.ts to import lib modules
// that start with `import "server-only"`.
export {};

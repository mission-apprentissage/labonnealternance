---
applyTo: "ui/**/*.{ts,tsx}"
excludeAgent: "coding-agent"
---

# Review guidelines — ui/

Flag violations of these architecture principles even where no lint/CI rule currently checks for them.

- **Deep Modules**: a component/hook/service should expose a simple interface hiding real complexity. Flag shallow wrappers that just delegate without reducing exposed complexity, and large files mixing multiple responsibilities that should be split into a deep module with a narrow interface instead of several interdependent small files.
- **File naming**: `.ts` files (hooks, utils, services) must be kebab-case. `.tsx` components stay PascalCase, *except* Next.js App Router reserved filenames (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`), which follow Next's own lowercase convention and must never be renamed. Flag any new `.ts` file that isn't kebab-case.
- **Cache Components / Partial Prefetching**: dynamic fetches must use `"use cache: private"` with `cacheTag()` and `cacheLife({ revalidate })`, never `"use cache"` once `headers()`/session cookies are read. Flag any reintroduction of `export const instant = false` (a completed migration flag, should never come back).
- **`<Activity>` resync pitfall**: components stay mounted across back-navigation instead of remounting. Flag any `useState(initialProp)` (or similar prop-derived initial state) that lacks a `useEffect(() => setState(prop), [prop])` to resync on prop change.
- **Zod v4**: flag `z.string().email()` (should be `z.email()`) and `.transform()` used for two-way schemas (should be `z.codec(input, output, { decode, encode })`).

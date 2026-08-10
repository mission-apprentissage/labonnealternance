---
applyTo: "{server,shared}/**/*.ts"
excludeAgent: "coding-agent"
---

# Review guidelines — server/ and shared/

Flag violations of these architecture principles even where no lint/CI rule currently checks for them.

- **Deep Modules**: a service/module should expose a simple interface hiding real complexity. Flag shallow wrappers that just delegate without reducing exposed complexity, and large service files mixing multiple responsibilities that should be split into a deep module with a narrow interface instead of several interdependent small files.
- **File naming**: all `.ts` files (services, jobs, utils, models, controllers) must be kebab-case. Flag any new file that isn't.
- **Zod v4**: flag `z.string().email()` (should be `z.email()`), `.transform()` used for two-way schemas (should be `z.codec(input, output, { decode, encode })`), and any leftover `AnyZodObject`/`ZodTypeAny` type (should be `z.ZodObject<any>`/`z.ZodType`).

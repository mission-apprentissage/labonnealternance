import { ObjectId } from "mongodb"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { zObjectId } from "shared/models/common"
import { ZPointGeometry } from "shared/models/index"
import type { z } from "zod"

/**
 * Minimal native replacement for zod-fixture (test-only dependency).
 * zod-fixture identifies schema types via the legacy Zod v3 `_def.typeName`
 * discriminator and v3-shaped check arrays, neither of which Zod v4 exposes
 * (`_zod.def.type` is a plain lowercase string, e.g. "object"/"string", and
 * checks/format are structured differently). zod-fixture has seen no release
 * addressing Zod v4, so rather than reflect-patch its internals for every
 * mismatch, this walks the schema tree directly using Zod v4's own (stable,
 * public) `_zod.def` shape and generates plausible values.
 */

const SIRETS = [
  "58006820882692",
  "94770756516212",
  "08993700810714",
  "89557430766546",
  "10392947668876",
  "81952222258729",
  "34843069553553",
  "55445073871148",
  "44477717954190",
  "62006652591225",
  "77147689105960",
]

let seed = 0
function nextSeed() {
  seed++
  return seed
}

function randomFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomString(): string {
  return Math.random().toString(36).slice(2, 12)
}

function randomInt(): number {
  return Math.floor(Math.random() * 1000)
}

function randomDate(): Date {
  return new Date(Date.now() - Math.floor(Math.random() * 1e10))
}

function randomRomeCode(): string {
  const letters = "ABCDEFGHIJKL"
  const letter = letters.charAt(Math.floor(Math.random() * letters.length))
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `${letter}${digits}`
}

function randomGeopoint() {
  return {
    type: "Point",
    coordinates: [-180 + Math.random() * 360, -90 + Math.random() * 180],
  }
}

type Path = (string | number)[]

function generate(schema: unknown, path: Path): unknown {
  if (schema === zObjectId) {
    return new ObjectId()
  }
  if (schema === extensions.siret) {
    return randomFrom(SIRETS)
  }
  if (schema === ZPointGeometry) {
    return randomGeopoint()
  }

  const zodSchema = schema as { _zod?: { def?: Record<string, any> }; shape?: Record<string, unknown> }
  const def = zodSchema._zod?.def
  if (!def?.type) {
    return undefined
  }
  const lastPath = path[path.length - 1]

  switch (def.type) {
    case "object": {
      if (lastPath === "geopoint") return randomGeopoint()
      const shape = zodSchema.shape ?? {}
      const result: Record<string, unknown> = {}
      for (const key of Object.keys(shape)) {
        result[key] = generate(shape[key], [...path, key])
      }
      return result
    }
    case "array": {
      if (lastPath === "offer_rome_codes") return [randomRomeCode()]
      if (lastPath === "status") {
        // Default *user* status histories to a "validated & active" state:
        // most tests don't exercise status transitions and would otherwise
        // flakily fail whenever independent random per-event status picks
        // happen to omit VALIDATION_EMAIL or land on a disabled state. Only
        // applies when the element's own `status` field is this same
        // user-event enum (other entities, e.g. companies, reuse the "status"
        // field name with an unrelated enum and must keep their own random pick).
        const statusEnumEntries = (def.element as { shape?: Record<string, any> })?.shape?.status?._zod?.def?.entries
        const statusEnumValues = statusEnumEntries ? Object.values(statusEnumEntries) : []
        if (statusEnumValues.includes("VALIDATION_EMAIL") && statusEnumValues.includes("ACTIF")) {
          const first = generate(def.element, [...path, 0]) as Record<string, unknown>
          const second = generate(def.element, [...path, 1]) as Record<string, unknown>
          return [
            { ...first, status: "VALIDATION_EMAIL" },
            { ...second, status: "ACTIF" },
          ]
        }
      }
      return Array.from({ length: 2 }, (_, i) => generate(def.element, [...path, i]))
    }
    case "tuple":
      return (def.items ?? []).map((item: unknown, i: number) => generate(item, [...path, i]))
    case "record": {
      const key = generate(def.keyType, path)
      return { [String(key)]: generate(def.valueType, path) }
    }
    case "union":
      return generate(def.options?.[0], path)
    case "intersection":
      return { ...(generate(def.left, path) as object), ...(generate(def.right, path) as object) }
    case "literal":
      return def.values?.[0]
    case "enum": {
      const values = Object.values(def.entries ?? {})
      return randomFrom(values as unknown[])
    }
    case "optional":
    case "nullable":
    case "readonly":
    case "nonoptional":
      return generate(def.innerType, path)
    case "default":
    case "prefault":
      return def.defaultValue
    case "pipe":
      return generate(def.in, path)
    case "lazy":
      try {
        return generate(def.getter(), path)
      } catch {
        return undefined
      }
    case "string":
      if (lastPath === "email" || def.format === "email") return `rando${nextSeed()}@email.com`
      if (lastPath === "applicant_attachment_name") return "file.pdf"
      // date_debut/date_fin are raw date strings (z.array(z.string())), later fed
      // through `new Date(...)` by application code (not by the zod schema itself,
      // which can't be format-checked here) - an arbitrary random string becomes an
      // Invalid Date, which Zod v4's stricter response encoding now rejects outright.
      if (path[path.length - 2] === "date_debut" || path[path.length - 2] === "date_fin") return randomDate().toISOString()
      if (def.format === "url") return "https://example.com"
      if (def.format === "uuid") return "00000000-0000-4000-8000-000000000000"
      if (def.format === "datetime") return new Date().toISOString()
      return randomString()
    case "number":
      return randomInt()
    case "boolean":
      return Math.random() < 0.5
    case "date":
      return randomDate()
    case "bigint":
      return BigInt(randomInt())
    case "null":
      return null
    case "any":
    case "unknown":
      return undefined
    default:
      return undefined
  }
}

export function generateFixture<T extends z.ZodType>(schema: T): z.output<T> {
  return generate(schema, []) as z.output<T>
}

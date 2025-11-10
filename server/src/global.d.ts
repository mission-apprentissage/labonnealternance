// Global type augmentation for dayjs plugins
import type * as dayjs from "dayjs"

declare module "dayjs" {
  interface Dayjs {
    utc(keepLocalTime?: boolean): Dayjs
    tz(timezone?: string, keepLocalTime?: boolean): Dayjs
    isBetween(a: any, b: any, c?: string | null, d?: string): boolean
    isSameOrBefore(date: any, unit?: string): boolean
    isSameOrAfter(date: any, unit?: string): boolean
    isYesterday(): boolean
  }

  interface Tz {
    (date?: any, timezone?: string): dayjs.Dayjs
    (date: any, format: string, timezone?: string): dayjs.Dayjs
    guess(): string
    setDefault(timezone?: string): void
  }

  function utc(date?: any, format?: string): dayjs.Dayjs
  const tz: Tz
}

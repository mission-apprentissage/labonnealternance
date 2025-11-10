// Global type augmentation for dayjs plugins used in shared/helpers/dayjs.ts for server & ui workspace
import "dayjs"

declare module "dayjs" {
  interface Dayjs {
    utc(keepLocalTime?: boolean): Dayjs
    tz(timezone?: string, keepLocalTime?: boolean): Dayjs
    isBetween(a: any, b: any, c?: string | null, d?: string): boolean
    isSameOrBefore(date: any, unit?: string): boolean
    isSameOrAfter(date: any, unit?: string): boolean
    isYesterday(): boolean
  }

  function utc(date?: any, format?: string): Dayjs

  namespace dayjs {
    interface Tz {
      (date?: any, timezone?: string): Dayjs
      (date: any, format: string, timezone?: string): Dayjs
      guess(): string
      setDefault(timezone?: string): void
    }

    const tz: Tz
  }
}

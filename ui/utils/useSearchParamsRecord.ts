import { useSearchParams } from "next/navigation"

export const useSearchParamsRecord = () => {
  const searchParams = useSearchParams()
  const record: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    record[key] = value
  }
  return record
}

import { useRouter } from "next/router"

export const useSingleValueQueryParams = (): { [key: string]: string | undefined } => {
  const router = useRouter()
  return Object.fromEntries(Object.entries(router.query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))
}

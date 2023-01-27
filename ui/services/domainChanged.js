import { fetchRomes } from "../services/fetchRomes"

export default async function domainChanged(val, setDomainErrorFunc) {
  const res = await fetchRomes(val, () => {
    setDomainErrorFunc(true)
  })

  if (res === "cancelled") {
    return []
  }

  return res
}

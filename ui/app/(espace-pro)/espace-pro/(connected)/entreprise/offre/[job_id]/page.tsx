import { PageWithParams } from "./PageWithParams"
import { getSession } from "@/utils/getSession"

export default async function Page() {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user
  return <PageWithParams establishment_id={establishment_id} />
}

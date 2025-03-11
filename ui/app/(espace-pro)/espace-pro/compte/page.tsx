import CompteRenderer from "@/app/(espace-pro)/espace-pro/compte/CompteRenderer"
import { getConnectedSessionUser } from "@/utils/sessionUtils"

export default async function Compte() {
  const user = await getConnectedSessionUser()
  return <CompteRenderer user={user} />
}

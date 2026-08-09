import type { Metadata } from "next"
import { DepotRapideFin } from "@/app/(espace-pro)/_components/DepotRapideFin"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Fin de création d'offre - La bonne alternance",
}

function Page() {
  return <DepotRapideFin />
}

export default Page

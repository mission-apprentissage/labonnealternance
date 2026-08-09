import type { Metadata } from "next"
import OptoutUnsubscribePage from "./OptoutUnsubscribePage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Désinscription du service Rendez-vous Apprentissage - La bonne alternance",
}

const Page = async () => {
  return <OptoutUnsubscribePage />
}

export default Page

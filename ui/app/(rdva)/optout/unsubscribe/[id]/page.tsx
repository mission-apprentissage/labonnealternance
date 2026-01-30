import type { Metadata } from "next"
import OptoutUnsubscribePage from "./OptoutUnsubscribePage"

export const metadata: Metadata = {
  title: "Désinscription du service Rendez-vous Apprentissage - La bonne alternance",
}

const Page = async () => {
  return <OptoutUnsubscribePage />
}

export default Page

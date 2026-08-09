import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import CompteEnAttente from "./CompteEnAttente"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: PAGES.static.backCreateCFAEnAttente.getMetadata().title,
}

export default function PageCompteEnAttente() {
  return <CompteEnAttente />
}

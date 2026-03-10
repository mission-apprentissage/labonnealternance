import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import CompteEnAttente from "./CompteEnAttente"

export const metadata: Metadata = {
  title: PAGES.static.backCreateCFAEnAttente.getMetadata().title,
}

export default function PageCompteEnAttente() {
  return <CompteEnAttente />
}

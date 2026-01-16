import type { Metadata } from "next"
import CompteEnAttente from "./CompteEnAttente"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.backCreateCFAEnAttente.getMetadata().title,
}

export default function PageCompteEnAttente() {
  return <CompteEnAttente />
}

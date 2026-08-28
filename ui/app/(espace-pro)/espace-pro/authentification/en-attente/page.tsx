import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import CompteEnAttente from "./CompteEnAttente"
export const metadata: Metadata = {
  title: METADATA.static.backCreateCFAEnAttente().title,
}

export default function PageCompteEnAttente() {
  return <CompteEnAttente />
}

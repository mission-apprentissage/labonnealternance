import type { Metadata } from "next"
import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Formulaire de dépôt d'offre - La bonne alternance",
}

export default async function Widget({ params }: { params: Promise<{ origin: string }> }) {
  const { origin } = await params
  return <CreationCompte type={AUTHTYPE.ENTREPRISE} isWidget={true} origin={origin} />
}

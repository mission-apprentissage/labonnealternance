import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ApiError, apiGet } from "@/utils/api.utils"
import { LienNonAutorise } from "./LienNonAutorise"
import OptoutUnsubscribePage from "./OptoutUnsubscribePage"
export const metadata: Metadata = {
  title: "Désinscription du service Rendez-vous Apprentissage - La bonne alternance",
}

const Page = async ({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) => {
  const { id } = await params
  const { token = "" } = await searchParams

  try {
    const etablissement = await apiGet("/etablissements/:id", {
      params: { id },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    return <OptoutUnsubscribePage id={id} token={token} etablissement={etablissement} />
  } catch (err) {
    if (err instanceof ApiError) {
      // L'API vérifie l'existence avant le jeton (cf. assertEtablissementExists) : 404 = id inconnu, 401/403 = jeton absent, expiré ou émis pour un autre établissement.
      if (err.isNotFoundError()) {
        notFound()
      }
      if ([401, 403].includes(err.context.statusCode)) {
        return <LienNonAutorise />
      }
    }
    throw err
  }
}

export default Page

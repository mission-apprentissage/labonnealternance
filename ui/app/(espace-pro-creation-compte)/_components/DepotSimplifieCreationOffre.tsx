"use client"

import { useRouter } from "next/navigation"

import { Bandeau } from "@/app/(espace-pro)/_components/Bandeau"
import { FormulaireEditionOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffre"
import { createOffreByToken } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export function DepotSimplifieCreationOffre({ isWidget = false }: { isWidget?: boolean }) {
  const router = useRouter()
  const { displayBanner, userId, establishment_id } = useSearchParamsRecord()
  const { email, token } = useSearchParamsRecord() as { token: string; email: string }

  const submit = async (values) => {
    const { job_id, token: jobToken } = await createOffreByToken(establishment_id, values, token)
    router.replace(
      PAGES.dynamic
        .espaceProCreationFin({
          jobId: job_id,
          email,
          withDelegation: false,
          fromDashboard: false,
          userId: userId,
          token: jobToken ?? undefined,
          isWidget: isWidget,
        })
        .getPath()
    )
  }

  return (
    <>
      <Bandeau
        type="success"
        header={`Votre compte a été créé avec succès${displayBanner === "true" ? " et est en attente de vérification" : ""}.`}
        description="Déposez votre offre dès maintenant."
      />
      <FormulaireEditionOffre establishment_id={establishment_id} handleSave={submit} />
    </>
  )
}

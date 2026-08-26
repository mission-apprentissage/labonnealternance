"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Bandeau } from "@/app/(espace-pro)/_components/Bandeau"
import { FormulaireEditionOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffre"
import { createEtablissementDelegationByToken, createOffreByToken } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/use-search-params-record"

export function DepotSimplifieCreationOffre({ isWidget = false }: { isWidget?: boolean }) {
  const router = useRouter()
  const { displayBanner, userId, establishment_id } = useSearchParamsRecord()
  const { email, token } = useSearchParamsRecord() as { token: string; email: string }
  const [hasChangedScreen, setChangedScreen] = useState(false)

  const submit = async (allValues: any) => {
    const { etablissementCatalogueIds, ...values } = allValues
    const { job_id, token: jobToken } = await createOffreByToken(establishment_id, values, token)

    const withDelegation = Boolean(etablissementCatalogueIds?.length)
    if (withDelegation) {
      // partage l'offre aux CFA sélectionnés à l'étape 3 du tunnel ; ne bloque pas la redirection en cas d'échec
      await createEtablissementDelegationByToken({ jobId: job_id, data: { etablissementCatalogueIds }, token: jobToken }).catch((error) => {
        console.error("Échec du partage de l'offre aux centres de formation sélectionnés", error)
      })
    }

    router.replace(
      PAGES.dynamic
        .espaceProCreationFin({
          jobId: job_id,
          email,
          withDelegation,
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
      {!hasChangedScreen && (
        <Bandeau
          type="success"
          header={`Votre compte a été créé avec succès${displayBanner === "true" ? " et est en attente de vérification" : ""}.`}
          description="Déposez votre offre dès maintenant."
        />
      )}
      <FormulaireEditionOffre establishment_id={establishment_id} handleSave={submit} onChangeScreen={() => setChangedScreen(true)} />
    </>
  )
}

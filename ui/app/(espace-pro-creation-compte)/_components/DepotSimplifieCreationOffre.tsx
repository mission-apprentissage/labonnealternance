"use client"

import { useRouter } from "next/navigation"
import { IJob } from "shared"

import { FormulaireEditionOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffre"
import { Bandeau } from "@/components/espace_pro/Bandeau"
import { createOffreByToken } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export function DepotSimplifieCreationOffre() {
  const router = useRouter()
  const { displayBanner, userId, establishment_id } = useSearchParamsRecord()
  const { email, token } = useSearchParamsRecord() as { token: string; email: string }

  const submit = async (values) => {
    const { recruiter: formulaire, token: jobToken } = await createOffreByToken(establishment_id, values, token)
    const job = formulaire.jobs.at(-1) as IJob
    router.replace(
      PAGES.dynamic
        .espaceProCreationFin({
          jobId: job._id.toString(),
          email,
          withDelegation: false,
          fromDashboard: false,
          userId: userId,
          token: jobToken ?? undefined,
          isWidget: false,
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

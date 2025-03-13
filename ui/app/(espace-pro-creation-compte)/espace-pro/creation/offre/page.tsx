"use client"

import { FormulaireEditionOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffre"
import { Bandeau } from "@/components/espace_pro/Bandeau"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function DepotRapideAjouterVoeux() {
  const { displayBanner, userId, establishment_id } = useSearchParamsRecord()

  return (
    <>
      <Bandeau
        type="success"
        header={`Votre compte a été créé avec succès${displayBanner === "true" ? " et est en attente de vérification" : ""}.`}
        description="Déposez votre offre dès maintenant."
      />
      <FormulaireEditionOffre establishment_id={establishment_id} user_id={userId} />
    </>
  )
}

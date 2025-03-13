"use client"

import { Container, useToast } from "@chakra-ui/react"
import { useQuery, useQueryClient } from "react-query"
import { AUTHTYPE } from "shared/constants"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { FormulaireEditionOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffre"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { createOffre, getOffre } from "@/utils/api"
import { apiPut } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

export default function UpsertOffre({ establishment_id, job_id, onSuccess }: { establishment_id: string; job_id?: string; onSuccess: () => void }) {
  const { user } = useConnectedSessionClient()

  const toast = useToast()
  const client = useQueryClient()

  const { data: offre, isLoading } = useQuery("offre", () => getOffre(job_id), {
    enabled: Boolean(job_id),
    cacheTime: 0,
  })

  const handleSave = async (values) => {
    // Updates an offer
    if (job_id) {
      await apiPut("/formulaire/offre/:jobId", { params: { jobId: job_id }, body: { ...values, job_update_date: new Date() } }).then(() => {
        toast({
          title: "Offre mise à jour avec succès.",
          position: "top-right",
          status: "success",
          duration: 2000,
          isClosable: true,
        })
        onSuccess()
      })
    } else {
      const { recruiter: formulaire } = await createOffre(establishment_id, values)
      if (user.type === AUTHTYPE.ENTREPRISE) {
        // Create the offer and return the form with the related offer created
        return {
          form: formulaire,
          offre: formulaire.jobs.slice(-1).shift(),
        }
      }
      toast({
        title: "Offre enregistrée avec succès.",
        position: "top-right",
        status: "success",
        duration: 2000,
        isClosable: true,
      })
      client.invalidateQueries("offre-liste")
      onSuccess()
    }
  }

  if (isLoading) return <LoadingEmptySpace label="Chargement en cours" />

  return (
    <Container maxW="container.xl" mt={5}>
      <Breadcrumb pages={[PAGES.static.backCfaHome, PAGES.dynamic.backCfaPageEntreprise(establishment_id), PAGES.dynamic.backCfaEntrepriseCreationOffre(establishment_id)]} />
      <FormulaireEditionOffre establishment_id={establishment_id} handleSave={handleSave} offre={offre} />
    </Container>
  )
}

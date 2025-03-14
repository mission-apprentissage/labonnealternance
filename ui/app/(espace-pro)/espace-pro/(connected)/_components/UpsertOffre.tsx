"use client"

import { Container, useToast } from "@chakra-ui/react"
import { useQuery } from "react-query"
import { assertUnreachable } from "shared"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { FormulaireEditionOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffre"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { createOffre, getOffre } from "@/utils/api"
import { apiPut } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

export default function UpsertOffre({ establishment_id, job_id, user_id, onSuccess }: { establishment_id: string; user_id?: string; job_id?: string; onSuccess: () => void }) {
  const toast = useToast()
  const { user } = useConnectedSessionClient()

  const { data: offre, isLoading } = useQuery("offre", () => getOffre(job_id), {
    enabled: Boolean(job_id),
    cacheTime: 0,
  })

  const getBreadCrumbList = () => {
    switch (user.type) {
      case "CFA":
        return [PAGES.static.backCfaHome, PAGES.dynamic.backCfaPageEntreprise(establishment_id), PAGES.dynamic.backCfaEntrepriseCreationOffre(establishment_id)]
      case "ENTREPRISE":
        return [PAGES.dynamic.backHomeEntreprise(establishment_id), PAGES.dynamic.backEditionOffre({ establishment_id, job_id })]
      case "ADMIN":
        return [PAGES.static.backAdminHome, PAGES.dynamic.backAdminRecruteurOffres(user_id), PAGES.dynamic.backEditionOffre({ establishment_id, job_id })]
      default:
        assertUnreachable("account type not allowed ${user.account_type}" as never)
    }
  }

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
      await createOffre(establishment_id, values)
      toast({
        title: "Offre enregistrée avec succès.",
        position: "top-right",
        status: "success",
        duration: 2000,
        isClosable: true,
      })
      onSuccess()
    }
  }

  if (isLoading) return <LoadingEmptySpace label="Chargement en cours" />

  return (
    <Container maxW="container.xl" mt={5}>
      <Breadcrumb pages={getBreadCrumbList()} />
      <FormulaireEditionOffre establishment_id={establishment_id} handleSave={handleSave} offre={offre} />
    </Container>
  )
}

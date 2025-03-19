"use client"

import { useToast } from "@chakra-ui/react"
import { useQuery } from "react-query"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { FormulaireEditionOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffre"
import { createOffre, getOffre } from "@/utils/api"
import { apiPut } from "@/utils/api.utils"

export default function UpsertOffre({ establishment_id, job_id, onSuccess }: { establishment_id: string; job_id?: string; onSuccess: () => void }) {
  const toast = useToast()

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

  return <FormulaireEditionOffre establishment_id={establishment_id} handleSave={handleSave} offre={offre} />
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import DetailEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/DetailEntreprise"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { getEntrepriseManagedByCfa } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export function EntrepriseInformationsPage({ establishment_id }: { establishment_id: string }) {
  const { access } = useConnectedSessionClient()
  const cfaId = access.cfas?.at(0)
  const {
    data: recruiter,
    isLoading: recruiterLoading,
    refetch: refetchRecruiter,
  } = useQuery({
    queryKey: ["recruiter", cfaId, establishment_id],
    enabled: Boolean(establishment_id && cfaId),
    queryFn: () => getEntrepriseManagedByCfa(cfaId, establishment_id),
  })

  if (!establishment_id || recruiterLoading) {
    return <LoadingEmptySpace />
  }

  const establishmentLabel = recruiter.establishment_raison_sociale ?? recruiter.establishment_siret

  return (
    <>
      <Breadcrumb
        pages={[PAGES.static.backCfaHome, PAGES.dynamic.backCfaPageEntreprise(establishment_id, establishmentLabel), PAGES.dynamic.backCfaPageInformations(establishment_id)]}
      />
      <DetailEntreprise
        userRecruteur={recruiter}
        onChange={() => {
          refetchRecruiter()
        }}
      />
    </>
  )
}

"use client"

import { Box } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useParams, useSearchParams } from "next/navigation"
import { AUTHTYPE } from "shared/constants/recruteur"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import DetailEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/DetailEntreprise"
import { getFormulaire, getUser } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export default function User() {
  const { userId } = useParams() as { userId: string }
  const searchParams = useSearchParams()
  const organizationId = searchParams.get("organizationId") || "unused"

  const {
    data: userRecruteur,
    isLoading,
    refetch: refetchUserRecruteur,
  } = useQuery({
    queryKey: ["user", userId, organizationId],
    queryFn: () => getUser(userId, organizationId),
    enabled: !!userId,
  })
  // Un CFA n'a pas de formulaire propre : son establishment_id ne correspond à aucune entreprise,
  // l'appel échouerait systématiquement (500). Les entreprises qu'il gère sont affichées séparément.
  const {
    data: recruiter,
    isLoading: recruiterLoading,
    refetch: refetchRecruiter,
  } = useQuery({
    queryKey: ["recruiter", userRecruteur?.establishment_id],
    enabled: Boolean(userRecruteur?.establishment_id) && userRecruteur?.type !== AUTHTYPE.CFA,
    queryFn: () => {
      if (!userRecruteur?.establishment_id) return Promise.resolve(undefined)
      return getFormulaire(userRecruteur.establishment_id)
    },
  })

  if (isLoading || !userRecruteur || !userId || recruiterLoading) {
    return <LoadingEmptySpace />
  }

  const establishmentLabel = userRecruteur.establishment_raison_sociale ?? userRecruteur.establishment_siret
  return (
    <>
      <Box
        sx={{
          maxWidth: 1200,
          marginX: "auto",
        }}
      >
        <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.dynamic.backAdminRecruteurOffres({ user_id: userId, user_label: establishmentLabel })]} />
        <DetailEntreprise
          userRecruteur={userRecruteur}
          recruiter={recruiter}
          onChange={() => {
            refetchUserRecruteur()
            refetchRecruiter()
          }}
        />
      </Box>
    </>
  )
}

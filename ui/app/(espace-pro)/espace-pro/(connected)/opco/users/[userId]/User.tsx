"use client"

import { Container } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import DetailEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/DetailEntreprise"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { getFormulaire, getUser } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export default function User() {
  const { userId } = useParams() as { userId: string }
  const { user } = useConnectedSessionClient()
  const connectedOpco = user.scope
  const router = useRouter()

  const {
    data: userRecruteur,
    isLoading,
    refetch: refetchUserRecruteur,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser(userId),
    enabled: !!userId,
  })
  const {
    data: recruiter,
    isLoading: recruiterLoading,
    refetch: refetchRecruiter,
  } = useQuery({
    queryKey: ["recruiter", userRecruteur?.establishment_id],
    enabled: Boolean(userRecruteur?.establishment_id),
    queryFn: () => getFormulaire(userRecruteur.establishment_id),
  })

  if (isLoading || !userRecruteur || !userId || recruiterLoading) {
    return <LoadingEmptySpace />
  }

  const establishmentLabel = userRecruteur.establishment_raison_sociale ?? userRecruteur.establishment_siret
  return (
    <Container maxW="container.xl" mt={5}>
      <Breadcrumb pages={[PAGES.static.backOpcoHome, PAGES.dynamic.backOpcoInformationEntreprise({ user_id: userId, user_label: establishmentLabel })]} />
      <DetailEntreprise
        userRecruteur={userRecruteur}
        recruiter={recruiter}
        onChange={({ opco }) => {
          if (opco && opco !== connectedOpco) {
            // les droits pour lire cette page ont été supprimés
            router.push(PAGES.static.backOpcoHome.getPath())
            return
          } else {
            refetchUserRecruteur()
            refetchRecruiter()
          }
        }}
      />
    </Container>
  )
}

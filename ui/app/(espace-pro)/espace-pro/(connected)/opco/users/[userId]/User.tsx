"use client"
import { Container } from "@chakra-ui/react"
import { useParams } from "next/navigation"
import { useQuery } from "react-query"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import DetailEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/DetailEntreprise"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { getFormulaire, getUser } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export default function User() {
  const { userId } = useParams() as { userId: string }

  const { data: userRecruteur, isLoading } = useQuery("user", () => getUser(userId), { cacheTime: 0, enabled: !!userId })
  const { data: recruiter, isLoading: recruiterLoading } = useQuery(["recruiter", userRecruteur?.establishment_id], {
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
      <DetailEntreprise userRecruteur={userRecruteur} recruiter={recruiter} />
    </Container>
  )
}

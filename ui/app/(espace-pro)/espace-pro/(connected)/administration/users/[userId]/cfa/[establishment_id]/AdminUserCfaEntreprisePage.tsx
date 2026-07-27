"use client"

import { Box } from "@mui/material"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { ConfirmationSuppressionEntreprise } from "@/app/(espace-pro)/espace-pro/(connected)/_components/ConfirmationSuppressionEntreprise"
import DetailEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/DetailEntreprise"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { getEntrepriseManagedByCfa, getFormulaire, getUser } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function AdminUserCfaEntreprisePage() {
  const { userId, establishment_id } = useParams() as { userId: string; establishment_id: string }
  const { cfaId } = useSearchParamsRecord()
  const router = useRouter()
  const queryClient = useQueryClient()
  const confirmationSuppression = useDisclosure()

  const {
    data: contact,
    isLoading: contactLoading,
    refetch: refetchContact,
  } = useQuery({
    queryKey: ["cfaManagedEntrepriseContact", cfaId, establishment_id],
    enabled: Boolean(cfaId && establishment_id),
    queryFn: () => getEntrepriseManagedByCfa(cfaId, establishment_id),
  })

  const { data: cfaUser, isLoading: cfaUserLoading } = useQuery({
    queryKey: ["user", userId],
    enabled: Boolean(userId),
    queryFn: () => getUser(userId),
  })

  // Même queryKey que ListeOffres : les offres de recrutement en alternance sont utilisées pour
  // que les invalidations internes à OffresTabs (prolongation, suppression d'offre) rafraîchissent cette page.
  const { data: recruiter, isLoading: recruiterLoading } = useQuery({
    queryKey: ["offre-liste", establishment_id],
    enabled: Boolean(establishment_id),
    queryFn: () => getFormulaire(establishment_id),
  })

  if (contactLoading || recruiterLoading || cfaUserLoading) {
    return <LoadingEmptySpace />
  }

  if (!contact || !recruiter || !cfaUser) {
    throw new Error(`Impossible de charger l'entreprise gérée par le CFA - userId: ${userId}, cfaId: ${cfaId}, establishment_id: ${establishment_id}`)
  }

  const establishmentLabel = contact.establishment_raison_sociale ?? contact.establishment_siret
  const cfaLabel = cfaUser.establishment_raison_sociale ?? cfaUser.establishment_siret

  return (
    <Box sx={{ maxWidth: 1200, marginX: "auto" }}>
      <ConfirmationSuppressionEntreprise
        establishment_id={establishment_id}
        establishment_raison_sociale={establishmentLabel}
        isOpen={confirmationSuppression.isOpen}
        onClose={confirmationSuppression.onClose}
        onSuccess={() => router.push(PAGES.dynamic.backAdminRecruteurOffres({ user_id: userId }).getPath())}
      />
      <Breadcrumb
        pages={[
          PAGES.static.backAdminHome,
          PAGES.dynamic.backAdminRecruteurOffres({ user_id: userId, user_label: cfaLabel }),
          PAGES.dynamic.backAdminUserCfaEntreprise({ user_id: userId, establishment_id, user_label: establishmentLabel }),
        ]}
      />
      <DetailEntreprise
        userRecruteur={contact}
        recruiter={recruiter}
        isCfaManagedEntreprise
        cfaUserId={userId}
        onDeleteEntreprisePartenaire={() => confirmationSuppression.onOpen()}
        onChange={() => {
          refetchContact()
          queryClient.invalidateQueries({ queryKey: ["offre-liste"] })
        }}
      />
    </Box>
  )
}

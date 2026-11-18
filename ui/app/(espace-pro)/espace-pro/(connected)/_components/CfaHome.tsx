"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { ICfaManagedRecruiterJson, IRecruiterJson } from "shared"
import { countOpenJobs } from "shared/models/job.model"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import Badge from "@/app/(espace-pro)/_components/Badge"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import TableWithPagination from "@/app/(espace-pro)/_components/TableWithPagination"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useToast } from "@/app/hooks/useToast"
import { DsfrIcon } from "@/components/DsfrIcon"
import { AnimationContainer } from "@/components/espace_pro"
import { getEntreprisesManagedByCfa } from "@/utils/api"
import { sortReactTableDate, sortReactTableString } from "@/utils/date-utils"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/use-search-params-record"
import { CfaHomeEntrepriseMenu } from "./CfaHomeEntrepriseMenu"
import { ConfirmationSuppressionEntreprise } from "./ConfirmationSuppressionEntreprise"

const EmptySpace = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", lg: "row" },
      mt: fr.spacing("6v"),
      px: fr.spacing("6v"),
      py: fr.spacing("6v"),
      border: "1px solid",
      borderColor: "grey.400",
      gap: "32px",
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: { xs: "center", lg: "flex-end" },
        alignItems: { xs: "center", lg: "flex-start" },
        width: { xs: "100%", lg: "350px" },
        height: "150px",
      }}
    >
      <Image width={246} height={170} src="/images/espace_pro/images/add-offer.svg" alt="" />
    </Box>

    <Box sx={{ width: { xs: "100%", lg: "600px" } }}>
      <Typography component="h2" sx={{ fontSize: { xs: "4rem", md: "2rem" }, pb: fr.spacing("6v") }} datatest-id="header-ajouter-entreprise">
        Ajoutez votre première entreprise partenaire
      </Typography>
      <Typography sx={{ fontSize: "1.375rem" }}>Une entreprise partenaire vous fait confiance pour gérer ses offres d’emploi ?</Typography>
      <Typography sx={{ fontSize: "1.375rem" }}>
        Décrivez les besoins de recrutement de cette entreprise pour les afficher sur le site <span style={{ fontWeight: "700" }}>La bonne alternance</span> dès aujourd’hui.
      </Typography>
    </Box>
  </Box>
)

function ListeEntreprise() {
  const [currentEntreprise, setCurrentEntreprise] = useState<IRecruiterJson | null>(null)
  const confirmationSuppression = useDisclosure()
  const router = useRouter()
  const { access } = useConnectedSessionClient()

  const toast = useToast()
  const { newUser: isNewUser } = useSearchParamsRecord()

  useEffect(() => {
    if (isNewUser) {
      toast({
        title: "Vérification réussie",
        description: "Votre adresse mail a été validée avec succès.",
        autoHideDuration: 7000,
      })
    }
  }, [isNewUser, toast])

  const cfaId = access?.cfas.at(0)

  const { data: entreprises, isLoading } = useQuery({
    queryKey: ["listeEntreprise"],
    queryFn: () => getEntreprisesManagedByCfa(cfaId),
    enabled: Boolean(cfaId),
  })

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  const columns = [
    {
      Header: "",
      id: "action",
      maxWidth: "48",
      disableSortBy: true,
      accessor: (row: IRecruiterJson) => {
        return <CfaHomeEntrepriseMenu row={row} confirmationSuppression={confirmationSuppression} setCurrentEntreprise={setCurrentEntreprise} />
      },
      srOnly: "Actions sur l'entreprise",
    },
    {
      Header: "Entreprise",
      id: "establishment_raison_sociale",
      width: "350",
      maxWidth: "350",
      accessor: ({ establishment_raison_sociale, establishment_siret, opco }) => [establishment_raison_sociale, establishment_siret, opco].join(" "),
      sortType: (a, b) => sortReactTableString(a.original.establishment_raison_sociale, b.original.establishment_raison_sociale),
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { establishment_raison_sociale, establishment_siret, establishment_id, opco } = data[id]
        const siretText = <Typography sx={{ color: "#666666", fontSize: "14px" }}>SIRET {establishment_siret}</Typography>
        const detailHref = PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath()
        // Sans raison sociale, c'est le SIRET qui porte le lien : un lien dont le seul contenu
        // serait le complément vocal n'aurait aucun texte visible ni surface cliquable (RGAA 6.1).
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {establishment_raison_sociale ? (
              <>
                <Link underline="hover" href={detailHref} sx={{ fontWeight: "700" }}>
                  {establishment_raison_sociale}
                  <span className="fr-sr-only"> - voir les informations</span>
                </Link>
                {siretText}
              </>
            ) : (
              <Link underline="hover" href={detailHref} sx={{ fontWeight: "700" }}>
                {siretText}
                <span className="fr-sr-only"> - voir les informations</span>
              </Link>
            )}
            <Typography sx={{ color: "redmarianne", fontSize: "14px" }}>{opco}</Typography>
          </Box>
        )
      },
    },
    {
      Header: "Contact entreprise",
      id: "contact_entreprise",
      width: "300",
      maxWidth: "300",
      accessor: "contact_entreprise",
      sortType: (a, b) => sortReactTableString(`${a.original.last_name} ${a.original.first_name}`, `${b.original.last_name} ${b.original.first_name}`),
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { last_name, first_name, email, phone } = data[id]
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 700 }}>
              {last_name} {first_name}
            </Typography>
            <Typography sx={{ color: "#666666", fontSize: "14px" }}>{email}</Typography>
            <Typography sx={{ color: "#666666", fontSize: "14px" }}>{phone}</Typography>
          </Box>
        )
      },
    },
    {
      Header: "Offres actives",
      id: "nombre_offres",
      sortType: "basic",
      accessor: ({ jobs }: ICfaManagedRecruiterJson) => countOpenJobs(jobs),
    },
    {
      Header: (
        <>
          Candidatures
          <Box component="span" sx={{ display: "block", fontWeight: 400 }}>
            dont « en attente »
          </Box>
        </>
      ),
      sortLabel: "Candidatures dont « en attente »",
      id: "candidatures",
      // Assez large pour « dont « en attente » » et l'icône de tri sur une ligne.
      width: "200",
      // Tri sur les candidatures en attente d'abord : par ordre décroissant, les entreprises qui attendent une réponse passent en tête.
      sortType: (a, b) => a.original.pending_applications_count - b.original.pending_applications_count || a.original.applications_count - b.original.applications_count,
      accessor: ({ applications_count }: ICfaManagedRecruiterJson) => applications_count,
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { applications_count, pending_applications_count } = data[id] as ICfaManagedRecruiterJson
        return (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: fr.spacing("1v") }}>
            {applications_count}
            {pending_applications_count > 0 && (
              <Badge variant="awaiting" fontSize="12px">
                {pending_applications_count}
                <span className="fr-sr-only"> en attente</span>
              </Badge>
            )}
          </Box>
        )
      },
    },
    {
      Header: "Ajoutée le",
      accessor: ({ createdAt }) => dayjs(createdAt).format("DD/MM/YYYY"),
      id: "createdAt",
      sortType: (a, b) => sortReactTableDate(a.original.createdAt, b.original.createdAt),
    },
  ]

  return (
    <AnimationContainer>
      {currentEntreprise && (
        <ConfirmationSuppressionEntreprise
          establishment_id={currentEntreprise.establishment_id}
          onClose={confirmationSuppression.onClose}
          isOpen={confirmationSuppression.isOpen}
          establishment_raison_sociale={currentEntreprise.establishment_raison_sociale}
        />
      )}
      <Box sx={{ maxWidth: 1200, mx: "auto", mt: fr.spacing("5v") }}>
        <Breadcrumb pages={[PAGES.static.backCfaHome]} />
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: fr.spacing("8v"), justifyContent: "space-between", mb: fr.spacing("6v") }}>
          <Box>
            <Typography component="h1" sx={{ fontSize: "2rem !important", fontWeight: 700, mb: 0 }}>
              Mes entreprises
            </Typography>
          </Box>
          <Box
            sx={{
              mr: fr.spacing("6v"),
            }}
          >
            <Button size="small" onClick={() => router.push(PAGES.static.backCfaCreationEntreprise.getPath())}>
              <DsfrIcon name="fr-icon-add-line" size={16} />
              Ajouter une entreprise
            </Button>
          </Box>
        </Box>
        {entreprises?.length ? (
          <TableWithPagination caption="Liste des entreprises" columns={columns} data={entreprises} exportable={false} defaultSortBy={[{ id: "candidatures", desc: true }]} />
        ) : (
          <EmptySpace />
        )}
      </Box>
    </AnimationContainer>
  )
}

export default ListeEntreprise

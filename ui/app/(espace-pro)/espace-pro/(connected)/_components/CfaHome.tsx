"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { IRecruiter, IRecruiterJson } from "shared"

import { CfaHomeEntrepriseMenu } from "./CfaHomeEntrepriseMenu"
import { ConfirmationSuppressionEntreprise } from "./ConfirmationSuppressionEntreprise"
import TableWithPagination from "@/app/(espace-pro)/_components/TableWithPagination"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { useToast } from "@/app/hooks/useToast"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { AnimationContainer, LoadingEmptySpace } from "@/components/espace_pro"
import { getEntreprisesManagedByCfa } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

const EmptySpace = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", lg: "row" },
      mt: fr.spacing("3w"),
      px: fr.spacing("3w"),
      py: fr.spacing("3w"),
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
      <Typography component="h2" sx={{ fontSize: { xs: "4rem", md: "2rem" }, pb: fr.spacing("3w") }} datatest-id="header-ajouter-entreprise">
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

  const { data, isLoading } = useQuery({
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
      maxWidth: "40",
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
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Link underline="hover" fontWeight="700" href={PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath()} aria-label="voir les informations">
              {establishment_raison_sociale}
            </Link>
            {establishment_raison_sociale ? (
              siretText
            ) : (
              <Link underline="hover" fontWeight="700" href={PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath()} aria-label="voir les informations">
                {siretText}
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
      width: "350",
      maxWidth: "350",
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
      Header: "Offres",
      id: "nombre_offres",
      sortType: "basic",
      accessor: ({ jobs }: IRecruiterJson) => jobs.length,
    },
    {
      Header: "Ajoutée le",
      accessor: ({ createdAt }) => dayjs(createdAt).format("DD/MM/YYYY"),
      id: "createdAt",
      sortType: (a, b) => sortReactTableDate(a.original.createdAt, b.original.createdAt),
    },
    {
      Header: "Dernière offre créée le",
      id: "date_creation_offre",
      disableSortBy: true,
      width: "225",
      accessor: ({ jobs }: IRecruiter /* should be IRecruiterJson but jobs is not typed properly */) => {
        if (jobs.length > 0) {
          const last = jobs.pop()
          return dayjs(last.job_creation_date).format("DD/MM/YYYY")
        } else {
          return ""
        }
      },
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
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: fr.spacing("4w"), justifyContent: "space-between", mb: fr.spacing("3w") }}>
          <Box>
            <Typography sx={{ fontSize: "2rem !important", fontWeight: 700 }}>Mes entreprises</Typography>
          </Box>
          <Box mr={3}>
            <Button size="small" onClick={() => router.push(PAGES.static.backCfaCreationEntreprise.getPath())}>
              Nouvelle entreprise
            </Button>
          </Box>
        </Box>
        {data?.length ? (
          <TableWithPagination caption="Liste des entreprises" columns={columns} data={data} exportable={false} defaultSortBy={[{ id: "createdAt", desc: true }]} />
        ) : (
          <EmptySpace />
        )}
      </Box>
    </AnimationContainer>
  )
}

export default ListeEntreprise

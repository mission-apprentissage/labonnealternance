"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Badge from "@codegouvfr/react-dsfr/Badge"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useMemo, useState } from "react"
import type { IRecruiterJson } from "shared"
import { AUTHTYPE } from "shared/constants/index"
import TableWithPagination from "@/app/(espace-pro)/_components/TableWithPagination"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useAuth } from "@/context/UserContext"
import { getCfaNonConformeCounts, getEntreprisesManagedByCfa } from "@/utils/api"
import { sortReactTableDate, sortReactTableString } from "@/utils/date-utils"
import { ConfirmationSuppressionEntreprise } from "./ConfirmationSuppressionEntreprise"
import { EntreprisesGereesParCfaMenu } from "./EntreprisesGereesParCfaMenu"

export function EntreprisesGereesParCfa({ cfaId, userId }: { cfaId: string; userId: string }) {
  const [currentEntreprise, setCurrentEntreprise] = useState<IRecruiterJson | null>(null)
  const confirmationSuppression = useDisclosure()
  const { user } = useAuth()
  // Compteur réservé aux administrateurs : la route renverrait 403 à un autre profil, ce qui fermerait sa session.
  const isAdmin = user?.type === AUTHTYPE.ADMIN

  const {
    data: entreprises,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["entreprisesGereesParCfa", cfaId],
    queryFn: () => getEntreprisesManagedByCfa(cfaId),
    enabled: Boolean(cfaId),
  })

  const { data: nonConformes, isSuccess: nonConformesLoaded } = useQuery({
    queryKey: ["entreprisesGereesParCfa", cfaId, "non-conformes"],
    queryFn: () => getCfaNonConformeCounts(cfaId),
    enabled: Boolean(cfaId) && isAdmin,
  })
  const nonConformesBySiret = useMemo(() => new Map((nonConformes?.entreprises ?? []).map(({ siret, non_conformes }) => [siret, non_conformes])), [nonConformes])
  const countNonConformes = ({ establishment_siret }: IRecruiterJson) => (nonConformesLoaded ? (nonConformesBySiret.get(establishment_siret) ?? 0) : null)

  if (error) {
    throw error
  }

  if (isLoading) {
    return <CircularProgress size={60} thickness={4} sx={{ color: "primary.main" }} />
  }

  const columns = [
    {
      Header: "",
      id: "action",
      maxWidth: "48",
      disableSortBy: true,
      accessor: (row: IRecruiterJson) => {
        return <EntreprisesGereesParCfaMenu row={row} userId={userId} cfaId={cfaId} confirmationSuppression={confirmationSuppression} setCurrentEntreprise={setCurrentEntreprise} />
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
        const { establishment_raison_sociale, establishment_siret, opco } = data[id]
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: "700" }}>{establishment_raison_sociale || establishment_siret}</Typography>
            {establishment_raison_sociale && <Typography sx={{ color: "#666666", fontSize: "14px" }}>SIRET {establishment_siret}</Typography>}
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
      accessor: ({ last_name, first_name, email, phone }: IRecruiterJson) => [last_name, first_name, email, phone].filter(Boolean).join(" "),
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
    ...(isAdmin
      ? [
          {
            Header: "Non conformes",
            id: "non_conformes",
            sortType: "basic",
            accessor: countNonConformes,
            Cell: ({ value }: { value: number | null }) => {
              if (value === null) {
                return (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="fr-sr-only">Nombre indisponible</span>
                  </>
                )
              }
              return value > 0 ? (
                <Badge small severity="warning">
                  {value}
                  <span className="fr-sr-only"> {value > 1 ? "offres non conformes" : "offre non conforme"}</span>
                </Badge>
              ) : (
                "0"
              )
            },
          },
        ]
      : []),
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
      accessor: ({ jobs }: IRecruiterJson) => {
        const lastJob = jobs.reduce<(typeof jobs)[number] | null>((acc, job) => {
          if (!job?.job_creation_date) return acc
          if (!acc) return job
          return dayjs(job.job_creation_date).isAfter(acc.job_creation_date) ? job : acc
        }, null)
        return lastJob?.job_creation_date ? dayjs(lastJob.job_creation_date).format("DD/MM/YYYY") : ""
      },
    },
  ]

  return (
    <Box>
      {currentEntreprise && (
        <ConfirmationSuppressionEntreprise
          establishment_id={currentEntreprise.establishment_id}
          onClose={confirmationSuppression.onClose}
          isOpen={confirmationSuppression.isOpen}
          establishment_raison_sociale={currentEntreprise.establishment_raison_sociale}
        />
      )}
      <Typography component="h2" sx={{ fontSize: "20px", fontWeight: "700", mb: fr.spacing("4v") }}>
        Entreprises partenaires
      </Typography>
      {entreprises?.length ? (
        <TableWithPagination
          caption="Liste des entreprises partenaires du CFA"
          columns={columns}
          data={entreprises}
          exportable={false}
          defaultSortBy={[{ id: "createdAt", desc: true }]}
        />
      ) : (
        <Typography>Ce CFA ne gère actuellement aucune entreprise.</Typography>
      )}
    </Box>
  )
}

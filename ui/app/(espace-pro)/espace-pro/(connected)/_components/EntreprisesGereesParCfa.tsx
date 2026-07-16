"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useState } from "react"
import type { IRecruiter, IRecruiterJson } from "shared"
import TableWithPagination from "@/app/(espace-pro)/_components/TableWithPagination"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { getEntreprisesManagedByCfa } from "@/utils/api"
import { ConfirmationSuppressionEntreprise } from "./ConfirmationSuppressionEntreprise"
import { EntreprisesGereesParCfaMenu } from "./EntreprisesGereesParCfaMenu"

export function EntreprisesGereesParCfa({ cfaId, userId }: { cfaId: string; userId: string }) {
  const [currentEntreprise, setCurrentEntreprise] = useState<IRecruiterJson | null>(null)
  const confirmationSuppression = useDisclosure()

  const { data: entreprises, isLoading } = useQuery({
    queryKey: ["entreprisesGereesParCfa", cfaId],
    queryFn: () => getEntreprisesManagedByCfa(cfaId),
    enabled: Boolean(cfaId),
  })

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

import { Box, Link, Stack, Typography } from "@mui/material"
import type { ColumnDef } from "@tanstack/react-table"
import dayjs from "dayjs"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"
import type { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import type { IUserRecruteur } from "shared/models/usersRecruteur.model"
import { getUserStatus } from "shared/models/usersRecruteur.model"

import type { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { CustomTag } from "@/components/SearchForTrainingsAndJobs/components/CustomTag"
import { UserMenu } from "../users/_component/UserMenu"
import { statusLabels, statusTagColor } from "../users/UsersList"

type DisclosureReturn = ReturnType<typeof useDisclosure>

export function getRecruteursColumns({
  setCurrentEntreprise,
  confirmationActivationUtilisateur,
  confirmationDesactivationUtilisateur,
}: {
  setCurrentEntreprise: (u: IUserRecruteurForAdminJSON | null) => void
  confirmationActivationUtilisateur: DisclosureReturn
  confirmationDesactivationUtilisateur: DisclosureReturn
}): ColumnDef<IUserRecruteurJson>[] {
  return [
    {
      id: "action",
      header: "",
      meta: { srOnly: "Actions sur le recruteur" },
      size: 50,
      enableSorting: false,
      cell: (info) => (
        <UserMenu
          row={info.row.original}
          setCurrentEntreprise={setCurrentEntreprise}
          confirmationActivationUtilisateur={confirmationActivationUtilisateur}
          confirmationDesactivationUtilisateur={confirmationDesactivationUtilisateur}
        />
      ),
    },
    {
      id: "establishment_raison_sociale",
      header: "Etablissement",
      accessorKey: "establishment_raison_sociale",
      size: 300,
      sortingFn: (a, b) => sortReactTableString(a.original.establishment_raison_sociale, b.original.establishment_raison_sociale),
      cell: (info) => {
        const { establishment_raison_sociale, establishment_siret, _id, opco, type } = info.row.original
        const siretText = (
          <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>
            SIRET {establishment_siret} <CustomTag color={type === "CFA" ? "yellow" : "green"}>{type}</CustomTag>
          </Typography>
        )
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Link fontWeight="700" href={`/espace-pro/administration/users/${_id}`} aria-label="voir les informations">
              {establishment_raison_sociale}
            </Link>
            {establishment_raison_sociale ? (
              siretText
            ) : (
              <Link fontWeight="700" href={`/espace-pro/administration/users/${_id}`} aria-label="voir les informations">
                {siretText}
              </Link>
            )}
            <Typography sx={{ color: "#666666", maxWidth: "100%", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", fontSize: ".75rem" }}>
              Opco : {opco}
            </Typography>
          </Box>
        )
      },
    },
    {
      id: "nom",
      header: "Contact",
      size: 280,
      enableSorting: false,
      accessorFn: (row) => `${row.first_name} ${row.last_name} ${row.email} ${row.phone}`,
      cell: (info) => {
        const { last_name, first_name, email, phone } = info.row.original
        return (
          <Stack spacing={0.5}>
            <Typography sx={{ color: "#666666", fontSize: ".75rem", fontWeight: 700 }}>
              {first_name} {last_name}
            </Typography>
            <Typography sx={{ color: "#666666", fontSize: ".75rem", whiteSpace: "normal", wordBreak: "break-all" }}>
              {email} ~ {phone}
            </Typography>
          </Stack>
        )
      },
    },
    {
      id: "createdAt",
      header: "Créé le",
      accessorKey: "createdAt",
      size: 120,
      sortingFn: (a, b) => sortReactTableDate(a.original.createdAt, b.original.createdAt),
      cell: (info) => <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>{dayjs(info.getValue<string>()).format("DD/MM/YYYY")}</Typography>,
    },
    {
      id: "currentStatus",
      header: "Statut",
      size: 160,
      accessorFn: (row) => getUserStatus(row.status as unknown as IUserRecruteur["status"]),
      sortingFn: (a, b) =>
        sortReactTableString(getUserStatus(a.original.status as unknown as IUserRecruteur["status"]), getUserStatus(b.original.status as unknown as IUserRecruteur["status"])),
      cell: (info) => {
        const s = info.getValue<ETAT_UTILISATEUR | null>()
        if (!s) return null
        return <CustomTag color={statusTagColor[s]}>{statusLabels[s]}</CustomTag>
      },
    },
    {
      id: "hasJobs",
      header: "Détail",
      accessorKey: "hasJobs",
      size: 180,
      sortingFn: (a, b) => {
        const aJobs = (a.original as IUserRecruteurForAdminJSON).hasJobs
        const bJobs = (b.original as IUserRecruteurForAdminJSON).hasJobs
        return aJobs === bJobs ? 0 : aJobs ? 1 : -1
      },
      cell: (info) => (info.getValue<boolean>() ? <CustomTag color="green">A des offres publiées</CustomTag> : <CustomTag color="pink">Aucune offre publiée</CustomTag>),
    },
  ]
}

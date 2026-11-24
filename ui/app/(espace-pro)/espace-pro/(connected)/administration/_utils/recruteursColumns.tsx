import { Box, Link, Stack, Typography } from "@mui/material"
import type { ColumnDef } from "@tanstack/react-table"
import dayjs from "dayjs"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"
import type { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import { CFA } from "shared/constants/recruteur"
import type { IUserRecruteur } from "shared/models/users-recruteur.model"
import { getUserStatus } from "shared/models/users-recruteur.model"
import {
  AccountConformityBadge,
  AccountTypeBadge,
  accountConformityRank,
  UserRecruteurStatusBadge,
} from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/ModerationBadges"
import type { useDisclosure } from "@/app/hooks/use-disclosure"
import { sortReactTableDate, sortReactTableString } from "@/utils/date-utils"
import { UserMenu } from "../users/_component/UserMenu"

const conformityRank = (row: IUserRecruteurJson) => accountConformityRank((row as IUserRecruteurForAdminJSON).offer_conformity)

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
        const organizationId = (info.row.original as IUserRecruteurForAdminJSON).organizationId || "unused"
        const siretText = (
          <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>
            SIRET {establishment_siret} <AccountTypeBadge as="span" type={type === CFA ? CFA : "ENTREPRISE"} />
          </Typography>
        )
        const detailHref = `/espace-pro/administration/users/${_id}?organizationId=${organizationId}`
        // Sans raison sociale, c'est le SIRET qui porte le lien : un lien dont le seul contenu
        // serait le complément vocal n'aurait aucun texte visible ni surface cliquable (RGAA 6.1).
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {establishment_raison_sociale ? (
              <>
                <Link fontWeight="700" href={detailHref}>
                  {establishment_raison_sociale}
                  <span className="fr-sr-only"> - voir les informations</span>
                </Link>
                {siretText}
              </>
            ) : (
              <Link fontWeight="700" href={detailHref}>
                {siretText}
                <span className="fr-sr-only"> - voir les informations</span>
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
      header: "Statut du compte",
      size: 160,
      accessorFn: (row) => getUserStatus(row.status as unknown as IUserRecruteur["status"]),
      sortingFn: (a, b) =>
        sortReactTableString(getUserStatus(a.original.status as unknown as IUserRecruteur["status"]), getUserStatus(b.original.status as unknown as IUserRecruteur["status"])),
      cell: (info) => <UserRecruteurStatusBadge status={info.getValue<ETAT_UTILISATEUR | null>()} />,
    },
    {
      id: "offer_conformity",
      header: "Conformité de l’offre",
      accessorFn: conformityRank,
      size: 190,
      // Valeur numérique : sans cette option, TanStack trie d'abord en décroissant, « aucune offre » en tête.
      sortDescFirst: false,
      sortingFn: (a, b) => conformityRank(a.original) - conformityRank(b.original),
      cell: (info) => <AccountConformityBadge conformity={(info.row.original as IUserRecruteurForAdminJSON).offer_conformity} />,
    },
  ]
}

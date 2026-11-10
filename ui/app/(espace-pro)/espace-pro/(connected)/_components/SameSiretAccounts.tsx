"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Alert as DsfrAlert } from "@codegouvfr/react-dsfr/Alert"
import { Alert, Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import type { ISameSiretAccountJson } from "shared/routes/user.routes"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { getFlatTableCellBordersSx, getFlatTableResetSx, getFlatTableWrapperSx } from "@/app/(espace-pro)/_components/table-styles"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getSameSiretAccounts } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { AccountStatusBadge } from "./AccountStatusBadge"

type Viewer = "ADMIN" | "OPCO"

const formatDate = (date: string | null) => (date ? dayjs(date).format("DD/MM/YYYY") : "—")

export const buildDuplicateWarning = (accounts: ISameSiretAccountJson[], isAwaitingValidation: boolean) => {
  const count = accounts.length
  const disabledCount = accounts.filter(({ status }) => status === ETAT_UTILISATEUR.DESACTIVE).length
  let summary: string
  if (count === 1) {
    summary = disabledCount ? "1 autre compte, désactivé, existe pour ce SIRET." : "1 autre compte existe pour ce SIRET."
  } else {
    const disabledPart = disabledCount ? `, dont ${disabledCount} désactivé${disabledCount > 1 ? "s" : ""}` : ""
    summary = `${count} autres comptes existent pour ce SIRET${disabledPart}.`
  }
  return `${summary} Vérifiez qu'il ne s'agit pas d'un doublon${isAwaitingValidation ? " avant d'activer ce compte" : ""}.`
}

const accountPath = (account: ISameSiretAccountJson, viewer: Viewer) =>
  viewer === "ADMIN"
    ? `${PAGES.dynamic.backAdminRecruteurOffres({ user_id: account._id }).getPath()}?organizationId=${account.organizationId}`
    : PAGES.dynamic.backOpcoInformationEntreprise({ user_id: account._id }).getPath()

export const SameSiretAccountsTable = ({ accounts, viewer }: { accounts: ISameSiretAccountJson[]; viewer: Viewer }) => {
  if (accounts.length === 0) {
    return <Typography sx={{ mt: fr.spacing("4v") }}>Aucun autre compte n'a été créé avec ce SIRET.</Typography>
  }

  return (
    <Box className="fr-table" sx={{ mt: fr.spacing("3v"), mb: 0 }}>
      <Box className="fr-table__wrapper" sx={getFlatTableWrapperSx()}>
        <Box className="fr-table__container">
          <Box className="fr-table__content">
            <Box component="table" sx={{ ...getFlatTableResetSx(), ...getFlatTableCellBordersSx() }}>
              <caption className="fr-sr-only">{accounts.length === 1 ? "1 autre compte avec ce SIRET" : `${accounts.length} autres comptes avec ce SIRET`}</caption>
              <Box component="thead">
                <tr>
                  <th scope="col">Compte</th>
                  <th scope="col">Créé le</th>
                  <th scope="col">Statut du compte</th>
                  <th scope="col">Dernière action</th>
                  <th scope="col">Motif du dernier statut</th>
                  <th scope="col">Offres</th>
                </tr>
              </Box>
              <Box component="tbody">
                {accounts.map((account) => (
                  <tr key={account._id}>
                    <td>
                      <DsfrLink href={accountPath(account, viewer)}>{`${account.first_name} ${account.last_name}`}</DsfrLink>
                      <Typography component="span" sx={{ display: "block", fontSize: "14px", color: "var(--text-mention-grey)", overflowWrap: "anywhere" }}>
                        {account.email}
                      </Typography>
                    </td>
                    <td>{formatDate(account.createdAt)}</td>
                    <td>
                      <AccountStatusBadge status={account.status} />
                      {account.status_date && (
                        <Typography component="span" sx={{ display: "block", fontSize: "14px", color: "var(--text-mention-grey)" }}>
                          depuis le {formatDate(account.status_date)}
                        </Typography>
                      )}
                    </td>
                    <td>{formatDate(account.last_action_date)}</td>
                    <td>{account.status_reason ?? "—"}</td>
                    <td>{account.jobs_count}</td>
                  </tr>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export const SameSiretAccounts = ({
  userId,
  organizationId,
  viewer,
  isAwaitingValidation,
}: {
  userId: string
  organizationId: string
  viewer: Viewer
  isAwaitingValidation: boolean
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["same-siret-accounts", userId, organizationId],
    queryFn: () => getSameSiretAccounts(userId, organizationId),
  })

  return (
    <Box component="section">
      <Typography component="h2" sx={{ fontSize: "22px", lineHeight: "28px", fontWeight: 700 }}>
        Autres comptes avec ce SIRET{data && data.length > 0 ? ` (${data.length})` : ""}
      </Typography>
      {isLoading && <LoadingEmptySpace />}
      {isError && (
        <Alert severity="error" sx={{ mt: fr.spacing("3v") }}>
          Les autres comptes de ce SIRET n'ont pas pu être chargés. Veuillez réessayer ultérieurement.
        </Alert>
      )}
      {data && data.length > 0 && <DsfrAlert severity="warning" small description={buildDuplicateWarning(data, isAwaitingValidation)} className={fr.cx("fr-mt-3v")} />}
      {data && <SameSiretAccountsTable accounts={data} viewer={viewer} />}
    </Box>
  )
}

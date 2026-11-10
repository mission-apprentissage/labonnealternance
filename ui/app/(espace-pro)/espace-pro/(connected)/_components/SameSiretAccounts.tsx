"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Badge } from "@codegouvfr/react-dsfr/Badge"
import { Alert, Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import type { ISameSiretAccountJson, SameSiretAccountMatch } from "shared/routes/user.routes"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { getFlatTableCellBordersSx, getFlatTableResetSx, getFlatTableWrapperSx } from "@/app/(espace-pro)/_components/table-styles"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getSameSiretAccounts } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { AccountStatusBadge } from "./AccountStatusBadge"
import { OTHER_ACCOUNTS_ANCHOR } from "./account-review/review-signals"

type Viewer = "ADMIN" | "OPCO"

const MATCH_LABELS: Record<SameSiretAccountMatch, string> = { phone: "Même téléphone", name: "Même nom" }

const formatDate = (date: string | null) => (date ? dayjs(date).format("DD/MM/YYYY") : "—")

export const useSameSiretAccounts = (userId: string, organizationId: string) =>
  useQuery({
    queryKey: ["same-siret-accounts", userId, organizationId],
    queryFn: () => getSameSiretAccounts(userId, organizationId),
  })

const accountPath = (account: ISameSiretAccountJson, viewer: Viewer) =>
  viewer === "ADMIN"
    ? `${PAGES.dynamic.backAdminRecruteurOffres({ user_id: account._id }).getPath()}?organizationId=${account.organizationId}`
    : PAGES.dynamic.backOpcoInformationEntreprise({ user_id: account._id, organization_id: account.organizationId }).getPath()

export const SameSiretAccountsTable = ({ accounts, viewer }: { accounts: ISameSiretAccountJson[]; viewer: Viewer }) => {
  if (accounts.length === 0) {
    return <Typography sx={{ mt: fr.spacing("3v") }}>Aucun autre compte n'a été créé avec ce SIRET.</Typography>
  }

  return (
    <Box className="fr-table" sx={{ mt: fr.spacing("3v"), mb: 0 }}>
      <Box className="fr-table__wrapper" sx={getFlatTableWrapperSx()}>
        <Box className="fr-table__container">
          <Box className="fr-table__content">
            <Box
              component="table"
              sx={{
                ...getFlatTableResetSx(),
                ...getFlatTableCellBordersSx(),
                width: "100%",
                tableLayout: "fixed",
                "& th, & td": { whiteSpace: "normal !important", overflowWrap: "anywhere", verticalAlign: "top" },
              }}
            >
              <caption className="fr-sr-only">{accounts.length === 1 ? "1 autre compte avec ce SIRET" : `${accounts.length} autres comptes avec ce SIRET`}</caption>
              <Box component="thead">
                <tr>
                  <th scope="col" style={{ width: "30%" }}>
                    Compte
                  </th>
                  <th scope="col" style={{ width: "14%" }}>
                    Créé le
                  </th>
                  <th scope="col" style={{ width: "24%" }}>
                    Statut du compte
                  </th>
                  <th scope="col" style={{ width: "22%" }}>
                    Points communs
                  </th>
                  <th scope="col" style={{ width: "10%" }}>
                    Offres
                  </th>
                </tr>
              </Box>
              <Box component="tbody">
                {accounts.map((account) => (
                  <tr key={account._id}>
                    <td>
                      <DsfrLink href={accountPath(account, viewer)}>{`${account.first_name} ${account.last_name}`}</DsfrLink>
                      <Typography component="span" sx={{ display: "block", fontSize: "14px", color: "var(--text-mention-grey)" }}>
                        {account.email}
                      </Typography>
                    </td>
                    <td>{formatDate(account.createdAt)}</td>
                    <td>
                      <AccountStatusBadge status={account.status} />
                      <Typography component="span" sx={{ display: "block", fontSize: "14px", color: "var(--text-mention-grey)" }}>
                        {[account.status_date && formatDate(account.status_date), account.status_reason].filter(Boolean).join(" · ")}
                      </Typography>
                    </td>
                    <td>
                      {account.matches.length === 0 ? (
                        <Typography component="span" sx={{ color: "var(--text-mention-grey)" }}>
                          Aucun
                        </Typography>
                      ) : (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("1v") }}>
                          {account.matches.map((match) => (
                            <Badge key={match} severity="warning" small noIcon as="span">
                              {MATCH_LABELS[match]}
                            </Badge>
                          ))}
                        </Box>
                      )}
                    </td>
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

export const SameSiretAccounts = ({ query, viewer }: { query: Pick<ReturnType<typeof useSameSiretAccounts>, "data" | "isLoading" | "isError">; viewer: Viewer }) => {
  const { data, isLoading, isError } = query

  return (
    <Box component="section" id={OTHER_ACCOUNTS_ANCHOR} sx={{ scrollMarginTop: fr.spacing("4v") }}>
      <Typography component="h2" sx={{ fontSize: "22px", lineHeight: "28px", fontWeight: 700 }}>
        Autres comptes avec ce SIRET{data && data.length > 0 ? ` (${data.length})` : ""}
      </Typography>
      {isLoading && <LoadingEmptySpace />}
      {isError && (
        <Alert severity="error" sx={{ mt: fr.spacing("3v") }}>
          Les autres comptes de ce SIRET n'ont pas pu être chargés. Veuillez réessayer ultérieurement.
        </Alert>
      )}
      {data && <SameSiretAccountsTable accounts={data} viewer={viewer} />}
      {data && data.length > 0 && viewer === "OPCO" && (
        <Typography sx={{ mt: fr.spacing("2v"), fontSize: "14px", color: "var(--text-mention-grey)" }}>Seules les offres rattachées à votre OPCO sont comptées.</Typography>
      )}
    </Box>
  )
}

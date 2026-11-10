import { fr } from "@codegouvfr/react-dsfr"
import { Badge } from "@codegouvfr/react-dsfr/Badge"
import { Box, Typography } from "@mui/material"
import dayjs from "dayjs"
import type { ReactNode } from "react"
import { Fragment } from "react"
import { AUTHTYPE } from "shared/constants/recruteur"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

const EXTERNAL_LINK_CLASS = "fr-link fr-link--sm fr-link--icon-right fr-icon-external-link-line"

type AccountSummary = {
  type: string
  email?: string | null
  establishment_siret?: string | null
  establishment_raison_sociale?: string | null
  establishment_enseigne?: string | null
  address?: string | null
  origin?: string | null
  createdAt?: string | null
}

export const AccountSummaryHeader = ({
  account,
  title,
  overline = "Compte recruteur",
  statusBadge,
  actions,
}: {
  account: AccountSummary
  title: string
  overline?: string
  statusBadge: ReactNode
  actions?: ReactNode
}) => {
  const { establishment_siret, email, address, origin, createdAt } = account
  const mapsLabel = account.establishment_enseigne ?? account.establishment_raison_sociale

  const details: ReactNode[] = [
    establishment_siret && (
      <>
        SIRET{" "}
        <DsfrLink href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${establishment_siret}`} className={EXTERNAL_LINK_CLASS}>
          {establishment_siret}
          <span className="fr-sr-only"> sur l&apos;Annuaire des entreprises</span>
        </DsfrLink>
      </>
    ),
    createdAt && `créé le ${dayjs(createdAt).format("DD/MM/YYYY")}`,
    origin && `origine : ${origin}`,
    email && (
      <DsfrLink href={`https://www.google.com/search?q=${encodeURIComponent(email)}`} className={EXTERNAL_LINK_CLASS} style={{ whiteSpace: "nowrap" }}>
        Rechercher l&apos;email
      </DsfrLink>
    ),
    mapsLabel && address && (
      <DsfrLink href={`https://www.google.com/maps/search/${encodeURIComponent(`${mapsLabel} ${address}`)}`} className={EXTERNAL_LINK_CLASS} style={{ whiteSpace: "nowrap" }}>
        Google Maps
      </DsfrLink>
    ),
  ].filter(Boolean)

  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v"), mb: fr.spacing("6v") }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: fr.spacing("6v"), flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v"), minWidth: 0 }}>
          <Typography component="p" sx={{ m: 0, fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--text-mention-grey)" }}>
            {overline}
          </Typography>
          <Typography component="h1" sx={{ m: 0, fontSize: "32px", lineHeight: "40px", fontWeight: 700, wordBreak: "break-word" }}>
            {title}
          </Typography>
        </Box>
        {actions && <Box>{actions}</Box>}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("2v"), flexWrap: "wrap" }}>
        <Badge severity="info" small noIcon as="span">
          {account.type === AUTHTYPE.CFA ? "CFA" : "Entreprise"}
        </Badge>
        {statusBadge}
        <Typography component="span" sx={{ fontSize: "14px", color: "var(--text-mention-grey)" }}>
          {details.map((detail, index) => (
            <Fragment key={index}>
              {index > 0 && " · "}
              {detail}
            </Fragment>
          ))}
        </Typography>
      </Box>
    </Box>
  )
}

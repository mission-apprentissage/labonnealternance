import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { parseEnum } from "shared"
import { CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/recruteur"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getCfaInformation, getEntrepriseInformation } from "@/utils/api"
import { isIdentifiedOpco, OPCO_SHORT_LABELS } from "@/utils/opco-labels"

const SIRENE_URL = "https://www.insee.fr/fr/information/6675111"

const InformationLegaleEntreprise = ({
  siret,
  type,
  opco,
  hideUnknownOpco = false,
}: {
  siret: string
  type: typeof CFA | typeof ENTREPRISE
  opco?: OPCOS_LABEL
  /** À la création, l'OPCO inconnu est demandé dans le formulaire : inutile de l'annoncer ici. */
  hideUnknownOpco?: boolean
}) => {
  const entrepriseQuery = useQuery({
    queryKey: ["get-entreprise", siret],
    queryFn: () => getEntrepriseInformation(siret, { skipUpdate: true }),
    enabled: Boolean(siret && type === ENTREPRISE),
  })
  const cfaQuery = useQuery({
    queryKey: ["get-cfa-infos", siret],
    queryFn: () => getCfaInformation(siret),
    enabled: Boolean(siret && type === CFA),
  })
  const { isLoading } = type === ENTREPRISE ? entrepriseQuery : cfaQuery

  if (isLoading) return null

  const entreprise = type === ENTREPRISE && entrepriseQuery.data && "data" in entrepriseQuery.data && "siret" in entrepriseQuery.data.data && entrepriseQuery.data.data
  const parsedOpco = opco ?? parseEnum(OPCOS_LABEL, entreprise?.opco)
  const knownOpco = isIdentifiedOpco(parsedOpco) ? OPCO_SHORT_LABELS[parsedOpco] : undefined
  const cfa = type === CFA && cfaQuery.data && "data" in cfaQuery.data && "siret" in cfaQuery.data.data && cfaQuery.data.data
  const raisonSociale = entreprise?.raison_sociale ?? cfa?.raison_sociale
  const enseigne = entreprise?.enseigne ?? cfa?.enseigne
  const address = entreprise?.address ?? cfa?.address
  const naf = entreprise ? [entreprise.naf_code, entreprise.naf_label].filter(Boolean).join(", ") : ""

  return (
    <Box sx={{ backgroundColor: fr.colors.decisions.background.alt.grey.default, p: { xs: fr.spacing("4v"), md: fr.spacing("6v") }, fontSize: "14px", lineHeight: "24px" }}>
      <Typography fontWeight={700} component="h2" sx={{ mb: fr.spacing("3v"), fontSize: { xs: "20px !important", md: "22px !important" }, lineHeight: "28px !important" }}>
        {type === ENTREPRISE ? "Informations de l'entreprise" : "Informations de l'établissement"}
      </Typography>
      {raisonSociale ? (
        <InfoLine>
          Informations issues du répertoire{" "}
          <DsfrLink href={SIRENE_URL} external>
            Sirene
          </DsfrLink>{" "}
          (Insee), non modifiables ici.
        </InfoLine>
      ) : (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: fr.spacing("2v"), mb: fr.spacing("3v") }}>
          <Box component="span" aria-hidden="true" className={fr.cx("fr-icon-information-line", "fr-icon--sm")} sx={{ mt: "2px" }} />
          <Box>
            <InfoLine>Suite à un problème technique, nous ne sommes pas en mesure d’afficher la raison sociale et l'adresse de l'établissement.</InfoLine>
            <InfoLine>Vous pouvez poursuivre : ces informations seront remplies automatiquement ultérieurement.</InfoLine>
          </Box>
        </Box>
      )}
      <InfoLine label="SIRET">{siret || "non identifié"}</InfoLine>
      {enseigne && <InfoLine label="Enseigne">{enseigne}</InfoLine>}
      {raisonSociale && <InfoLine label="Raison sociale">{raisonSociale}</InfoLine>}
      {address && <InfoLine label="Adresse">{address}</InfoLine>}
      {type === ENTREPRISE && naf && <InfoLine label="Activité (NAF)">{naf}</InfoLine>}
      {type === ENTREPRISE && (knownOpco || !hideUnknownOpco) && <InfoLine label="OPCO de référence">{knownOpco ?? "non renseigné"}</InfoLine>}
      {type === CFA && <InfoLine label="Qualiopi">Oui</InfoLine>}
      {type === ENTREPRISE && (
        <InfoLine label="Engagement Handicap recensé par">
          {(entreprise?.engagementHandicapOrigin && engagementHandicapLabels[entreprise.engagementHandicapOrigin]) || "inconnu"}
        </InfoLine>
      )}
    </Box>
  )
}

const InfoLine = ({ label, children }: { label?: string; children: ReactNode }) => (
  <Typography sx={{ fontSize: "inherit", lineHeight: "inherit", mb: `${fr.spacing("3v")} !important`, "&:last-child": { mb: "0 !important" }, overflowWrap: "anywhere" }}>
    {label ? (
      <>
        {label}&nbsp;: <b>{children}</b>
      </>
    ) : (
      children
    )}
  </Typography>
)

const engagementHandicapLabels: Record<EntrepriseEngagementSources, string> = {
  [EntrepriseEngagementSources.FRANCE_TRAVAIL]: "France Travail",
  [EntrepriseEngagementSources.LBA]: "La bonne alternance",
  [EntrepriseEngagementSources.LES_ENTREPRISE_S_ENGAGENT]: "Les entreprises s'engagent",
}

export default InformationLegaleEntreprise

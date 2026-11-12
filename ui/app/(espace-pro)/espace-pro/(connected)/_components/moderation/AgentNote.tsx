import { fr } from "@codegouvfr/react-dsfr"
import Tooltip from "@codegouvfr/react-dsfr/Tooltip"
import { Box, Typography } from "@mui/material"
import type { IModerationField } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_CATEGORY_LABELS, MODERATION_FIELD_LABELS } from "shared/models/jobs-partners-moderation-notes"

import { ConformityBadge } from "./ModerationBadges"
import type { IModerationFindingJson, IModerationSummaryJson } from "./moderation.types"

type IFinding = Pick<IModerationFindingJson, "champ" | "category" | "verbatim">

type IAgentNoteSection = { field: IModerationField; title: string; items: string[] }

// Ordre de la page de l'offre : la présentation de l'entreprise précède la description.
const FIELDS_IN_PAGE_ORDER: IModerationField[] = ["job_employer_description", "job_description"]

const AGENT_NOTE_CONFORME = "Conforme"

/** Note de l'agent pour les modérateurs, composée à l'affichage depuis les constats : un bloc par champ, un point par constat. */
export const getAgentNoteSections = (findings: IFinding[]): IAgentNoteSection[] =>
  FIELDS_IN_PAGE_ORDER.map((field) => ({
    field,
    title: MODERATION_FIELD_LABELS[field],
    items: findings.filter(({ champ }) => champ === field).map(({ category, verbatim }) => `${MODERATION_CATEGORY_LABELS[category]}${verbatim ? ` (“${verbatim}”)` : ""}`),
  }))

export const AgentNoteSections = ({ findings }: { findings: IFinding[] }) => (
  <>
    {getAgentNoteSections(findings).map(({ field, title, items }) =>
      items.length ? (
        <Box key={field} sx={{ mt: fr.spacing("2v") }}>
          <Typography component="p" sx={{ fontSize: "inherit", fontWeight: 500 }}>
            {title} :
          </Typography>
          <Box component="ul" sx={{ fontSize: "inherit", my: 0 }}>
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </Box>
        </Box>
      ) : (
        <Typography key={field} component="p" sx={{ fontSize: "inherit", mt: fr.spacing("2v") }}>
          <Box component="span" sx={{ fontWeight: 500 }}>
            {title} :
          </Box>{" "}
          {AGENT_NOTE_CONFORME}
        </Typography>
      )
    )}
  </>
)

export const AgentNoteBox = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      display: "flex",
      gap: fr.spacing("3v"),
      alignItems: "flex-start",
      backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      px: fr.spacing("4v"),
      py: fr.spacing("3v"),
      fontSize: "0.875rem",
    }}
  >
    <Box component="span" className="fr-icon-sparkling-2-line" aria-hidden="true" sx={{ color: fr.colors.decisions.text.title.grey.default }} />
    <Box>
      <Typography component="p" sx={{ fontWeight: 700, fontSize: "inherit" }}>
        Note de l’agent :
      </Typography>
      {children}
    </Box>
  </Box>
)

type IConformitySummary = Pick<IModerationSummaryJson, "offer_moderation_verdict" | "offer_moderation_status" | "findings">

/**
 * Conformité de l'offre et la note de l'agent derrière un bouton d'information (#5499) : une infobulle au survol
 * se poserait sur un élément non focalisable, inaccessible au clavier. L'infobulle DSFR est un `<span>` : pas de liste.
 */
export const ConformityWithAgentNote = ({ summary }: { summary: IConformitySummary | undefined }) => {
  const badge = <ConformityBadge verdict={summary?.offer_moderation_verdict} status={summary?.offer_moderation_status} />
  if (!summary?.offer_moderation_verdict || summary.offer_moderation_status !== "ok") return badge
  const title = (
    <>
      <strong>Note de l’agent :</strong>
      {getAgentNoteSections(summary.findings).map(({ field, title, items }) => (
        <span key={field} style={{ display: "block", marginTop: fr.spacing("1v") }}>
          {title} :{" "}
          {items.length
            ? items.map((item, index) => (
                <span key={index} style={{ display: "block" }}>
                  <span aria-hidden="true">• </span>
                  {item}
                </span>
              ))
            : AGENT_NOTE_CONFORME}
        </span>
      ))}
    </>
  )
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: fr.spacing("1v") }}>
      {badge}
      <Tooltip kind="click" title={title} />
    </Box>
  )
}

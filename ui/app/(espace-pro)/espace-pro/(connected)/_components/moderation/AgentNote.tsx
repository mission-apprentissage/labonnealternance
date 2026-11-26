"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useId, useState } from "react"
import type { IModerationField } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_CATEGORY_LABELS, MODERATION_FIELD_LABELS } from "shared/models/jobs-partners-moderation-notes"

import { ConformityBadge } from "./ModerationBadges"
import type { IModerationFindingJson, IModerationSummaryJson } from "./moderation.types"

type IFinding = Pick<IModerationFindingJson, "champ" | "category" | "verbatim">

type IAgentNoteItem = { label: string; verbatim: string | null }

type IAgentNoteSection = { field: IModerationField; title: string; items: IAgentNoteItem[] }

// Ordre de la page de l'offre : la présentation de l'entreprise précède la description.
const FIELDS_IN_PAGE_ORDER: IModerationField[] = ["job_employer_description", "job_description"]

const AGENT_NOTE_CONFORME = "Conforme"

/** Note de l'agent pour les modérateurs, composée à l'affichage depuis les constats : un bloc par champ, un point par constat. */
export const getAgentNoteSections = (findings: IFinding[]): IAgentNoteSection[] =>
  FIELDS_IN_PAGE_ORDER.map((field) => ({
    field,
    title: MODERATION_FIELD_LABELS[field],
    items: findings.filter(({ champ }) => champ === field).map(({ category, verbatim }) => ({ label: MODERATION_CATEGORY_LABELS[category], verbatim: verbatim || null })),
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
            {items.map(({ label, verbatim }, index) => (
              <li key={index}>
                {label}
                {verbatim && (
                  <>
                    {" "}
                    (<q>{verbatim}</q>)
                  </>
                )}
              </li>
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
      {/* !important : DepotSimplifieStyling (espace OPCO) impose sa taille aux h2 */}
      <Typography component="h2" sx={{ fontWeight: 700, fontSize: "inherit !important", lineHeight: "1.5rem !important" }}>
        Note de l’agent :
      </Typography>
      {children}
    </Box>
  </Box>
)

type IConformitySummary = Pick<IModerationSummaryJson, "offer_moderation_verdict" | "offer_moderation_status" | "findings">

/**
 * Conformité de l'offre et note de l'agent derrière un bouton de divulgation (#5499) : une infobulle au survol
 * se poserait sur un élément non focalisable, et le contenu d'une infobulle DSFR ne peut pas porter de liste.
 */
export const ConformityWithAgentNote = ({ summary }: { summary: IConformitySummary | undefined }) => {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  const badge = <ConformityBadge verdict={summary?.offer_moderation_verdict} status={summary?.offer_moderation_status} />
  if (!summary?.offer_moderation_verdict || summary.offer_moderation_status !== "ok") return badge
  return (
    <Box>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: fr.spacing("1v") }}>
        {badge}
        <button
          type="button"
          className={fr.cx("fr-btn--tooltip", "fr-btn")}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(event) => {
            if (isOpen && event.key === "Escape") {
              event.stopPropagation()
              setIsOpen(false)
            }
          }}
        >
          Note de l’agent
        </button>
      </Box>
      <Box
        id={panelId}
        hidden={!isOpen}
        sx={{
          mt: fr.spacing("1v"),
          fontSize: "0.75rem",
          lineHeight: "1.25rem",
          // cf. DecisionPanel : les puces ne doivent pas hériter de l'espacement des listes de DepotSimplifieStyling.
          '& ul:not([role="listbox"]) li': { mx: "0 !important", mb: "0 !important", fontSize: "inherit !important", lineHeight: "inherit !important" },
        }}
      >
        <AgentNoteSections findings={summary.findings} />
      </Box>
    </Box>
  )
}

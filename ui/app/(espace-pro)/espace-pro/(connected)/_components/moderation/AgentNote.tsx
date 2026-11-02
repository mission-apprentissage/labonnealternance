import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { IModerationField } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_CATEGORY_LABELS, MODERATION_FIELD_LABELS } from "shared/models/jobs-partners-moderation-notes"

import type { IModerationFindingJson } from "./moderation.types"

type IFinding = Pick<IModerationFindingJson, "champ" | "category" | "verbatim">

// Ordre de la page de l'offre : la présentation de l'entreprise précède la description.
const FIELDS_IN_PAGE_ORDER: IModerationField[] = ["job_employer_description", "job_description"]

/** Note de l'agent pour les modérateurs : par champ, le libellé de chaque catégorie relevée et son extrait. */
export const getAgentNoteLines = (findings: IFinding[]): string[] =>
  FIELDS_IN_PAGE_ORDER.map((field) => {
    const fieldFindings = findings.filter(({ champ }) => champ === field)
    const note = fieldFindings.length
      ? fieldFindings.map(({ category, verbatim }) => `${MODERATION_CATEGORY_LABELS[category]}${verbatim ? ` (“${verbatim}”)` : ""}`).join(" ; ")
      : "Conforme"
    return `${MODERATION_FIELD_LABELS[field]} : ${note}`
  })

export const AgentNoteLines = ({ findings }: { findings: IFinding[] }) => (
  <>
    {getAgentNoteLines(findings).map((line) => (
      <Typography key={line} sx={{ fontSize: "inherit" }}>
        {line}
      </Typography>
    ))}
  </>
)

export const AgentNoteBox = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      display: "flex",
      gap: fr.spacing("3v"),
      alignItems: "center",
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

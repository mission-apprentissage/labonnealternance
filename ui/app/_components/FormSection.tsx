import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { type ReactNode, useId } from "react"

/** Section numérotée des formulaires de compte : titre h2 relié à la section (`aria-labelledby`). */
export const FormSection = ({ title, children }: { title: string; children: ReactNode }) => {
  const titleId = useId()
  return (
    <Box component="section" aria-labelledby={titleId} sx={{ mb: fr.spacing("10v"), "&:last-of-type": { mb: 0 } }}>
      <Typography
        id={titleId}
        component="h2"
        sx={{
          color: fr.colors.decisions.text.title.blueFrance.default,
          fontWeight: 700,
          fontSize: { xs: "22px !important", md: "24px !important" },
          lineHeight: { xs: "28px !important", md: "32px !important" },
          mb: `${fr.spacing("4v")} !important`,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  )
}

/** Titre de page des formulaires de compte, suivi de la mention des champs obligatoires. */
export const AccountFormHeading = ({ title, showRequiredMention = true }: { title: ReactNode; showRequiredMention?: boolean }) => (
  <Box sx={{ mb: fr.spacing("8v") }}>
    <Typography
      component="h1"
      sx={{
        fontWeight: 700,
        fontSize: { xs: "28px !important", md: "40px !important" },
        lineHeight: { xs: "36px !important", md: "48px !important" },
        mb: `${fr.spacing("2v")} !important`,
        overflowWrap: "anywhere",
      }}
    >
      {title}
    </Typography>
    {showRequiredMention && (
      <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: fr.colors.decisions.text.mention.grey.default }}>Tous les champs sont obligatoires.</Typography>
    )}
  </Box>
)

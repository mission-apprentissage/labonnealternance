import { fr } from "@codegouvfr/react-dsfr"

// Mise en avant des termes dans le corps de texte : gras uniquement, sans couleur
// (le bleu DSFR est réservé aux liens pour éviter toute confusion avec un hyperlien).
export const accentSx = { fontWeight: 700 } as const

export const listicleCardSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  p: fr.spacing("6v"),
  backgroundColor: fr.colors.decisions.background.default.grey.default,
  borderRadius: "5px",
  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
  height: "100%",
  "&:hover": { backgroundColor: fr.colors.decisions.background.default.grey.hover },
} as const

export const kpiCardSx = {
  p: { xs: fr.spacing("3v"), md: fr.spacing("4v") },
  borderRadius: "5px",
  backgroundColor: fr.colors.decisions.background.default.grey.default,
  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
  textAlign: "center" as const,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: fr.spacing("1v"),
  minWidth: 0,
}

export const cardLinkStyle = { textDecoration: "none", backgroundImage: "none" } as const

export const cardTitleSx = {
  fontWeight: 700,
  fontSize: "20px",
  lineHeight: "28px",
  color: fr.colors.decisions.background.actionHigh.blueFrance.default,
} as const

export const cardSubtitleSx = {
  fontSize: "14px",
  color: fr.colors.decisions.text.mention.grey.default,
  mt: fr.spacing("1v"),
} as const

export const cardArrowSx = {
  flexShrink: 0,
  fontSize: "1.25rem",
  color: fr.colors.decisions.background.actionHigh.blueFrance.default,
  ml: fr.spacing("4v"),
} as const

export const formatLong = (raw: string) => raw.charAt(0) + raw.slice(1).toLowerCase()

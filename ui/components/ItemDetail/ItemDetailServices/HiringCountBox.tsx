import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

// Style calqué sur StatsInserJeunes.tsx (chiffre 32-40px en gras dans une carte grise) : convention
// déjà établie dans le repo pour un encart "chiffre clé" annexe sur une fiche détail.
export const HiringCountBox = ({ hiringCount3Years }: { hiringCount3Years: number }) => (
  <Box sx={{ textAlign: "center", backgroundColor: "#F6F6F6", maxWidth: "330px", p: 3 }}>
    <Typography sx={{ mb: 1, fontSize: "32px", fontWeight: 700 }}>{hiringCount3Years}</Typography>
    <Typography sx={{ mb: 0 }}>{hiringCount3Years === 1 ? "alternant recruté" : "alternants recrutés"} ces 3 dernières années</Typography>
  </Box>
)

export default HiringCountBox
